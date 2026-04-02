import Map "mo:core/Map";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Blob "mo:core/Blob";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type Track = {
    id : Text;
    title : Text;
    artist : Text;
    genre : Text;
    description : Text;
    priceInCents : Nat;
    coverArtBlobId : ?Text;
    audioFileBlobId : ?Text;
    uploadDate : Time.Time;
  };

  module Track {
    public func compare(track1 : Track, track2 : Track) : { #less; #equal; #greater } {
      Text.compare(track1.id, track2.id);
    };
  };

  type Purchase = {
    trackId : Text;
    purchaseDate : Time.Time;
    amountPaidInCents : Nat;
  };

  module Purchase {
    public func compare(purchase1 : Purchase, purchase2 : Purchase) : { #less; #equal; #greater } {
      Text.compare(purchase1.trackId, purchase2.trackId);
    };
  };

  type TrackStat = {
    trackId : Text;
    title : Text;
    artist : Text;
    purchaseCount : Nat;
    revenueInCents : Nat;
  };

  type AnalyticsResult = {
    totalTracks : Nat;
    totalPurchases : Nat;
    totalRevenueInCents : Nat;
    topTracks : [TrackStat];
  };

  let tracks = Map.empty<Text, Track>();
  let trackOwners = Map.empty<Text, Principal>();
  let userPurchases = Map.empty<Principal, Set.Set<Purchase>>();
  // Separate map for audio file formats — safe to add without migration
  let trackAudioFormats = Map.empty<Text, Text>();
  // Separate map for preview start seconds — safe to add without migration
  let trackPreviewStartSeconds = Map.empty<Text, Nat>();
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);
  include MixinStorage();

  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  public shared ({ caller }) func addTrack(track : Track, audioFormat : ?Text, previewStartSecs : ?Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: You must be signed in to upload tracks");
    };
    let newTrack : Track = {
      track with
      uploadDate = Time.now();
    };
    tracks.add(track.id, newTrack);
    trackOwners.add(track.id, caller);
    switch (audioFormat) {
      case (?fmt) { trackAudioFormats.add(track.id, fmt) };
      case (null) {};
    };
    switch (previewStartSecs) {
      case (?secs) { trackPreviewStartSeconds.add(track.id, secs) };
      case (null) {};
    };
  };

  public shared ({ caller }) func updateTrack(track : Track) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update tracks");
    };
    tracks.add(track.id, track);
  };

  public shared ({ caller }) func deleteTrack(trackId : Text) : async () {
    let isAdmin = AccessControl.hasPermission(accessControlState, caller, #admin);
    if (not isAdmin) {
      let isOwner = switch (trackOwners.get(trackId)) {
        case (null) { false };
        case (?owner) { owner == caller };
      };
      if (not isOwner) {
        Runtime.trap("Unauthorized: You can only delete your own tracks");
      };
    };
    tracks.remove(trackId);
    trackOwners.remove(trackId);
    trackAudioFormats.remove(trackId);
    trackPreviewStartSeconds.remove(trackId);
  };

  public query ({ caller }) func getTrack(trackId : Text) : async ?Track {
    tracks.get(trackId);
  };

  public query ({ caller }) func getAllTracks() : async [Track] {
    tracks.values().toArray().sort();
  };

  public query ({ caller }) func getMyUploadedTracks() : async [Track] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: You must be signed in");
    };
    tracks.values().toArray().filter(func(t) {
      switch (trackOwners.get(t.id)) {
        case (null) { false };
        case (?owner) { owner == caller };
      };
    }).sort();
  };

  public query ({ caller }) func getTrackAudioFormat(trackId : Text) : async ?Text {
    trackAudioFormats.get(trackId);
  };

  public query ({ caller }) func getTrackPreviewStartSeconds(trackId : Text) : async ?Nat {
    trackPreviewStartSeconds.get(trackId);
  };

  public query ({ caller }) func getAnalytics() : async AnalyticsResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view analytics");
    };
    let totalTracks = tracks.size();
    let purchaseCountMap = Map.empty<Text, Nat>();
    let revenueMap = Map.empty<Text, Nat>();
    var totalPurchases : Nat = 0;
    var totalRevenueInCents : Nat = 0;
    for (userPurchaseSet in userPurchases.values()) {
      for (purchase in userPurchaseSet.toArray().vals()) {
        totalPurchases += 1;
        totalRevenueInCents += purchase.amountPaidInCents;
        let prevCount = switch (purchaseCountMap.get(purchase.trackId)) {
          case (null) { 0 };
          case (?n) { n };
        };
        purchaseCountMap.add(purchase.trackId, prevCount + 1);
        let prevRevenue = switch (revenueMap.get(purchase.trackId)) {
          case (null) { 0 };
          case (?n) { n };
        };
        revenueMap.add(purchase.trackId, prevRevenue + purchase.amountPaidInCents);
      };
    };
    let topTracks = tracks.values().toArray()
      .map(func(t : Track) : TrackStat {
        let count = switch (purchaseCountMap.get(t.id)) {
          case (null) { 0 };
          case (?n) { n };
        };
        let rev = switch (revenueMap.get(t.id)) {
          case (null) { 0 };
          case (?n) { n };
        };
        { trackId = t.id; title = t.title; artist = t.artist; purchaseCount = count; revenueInCents = rev };
      })
      .sort(func(a : TrackStat, b : TrackStat) : { #less; #equal; #greater } {
        if (a.purchaseCount > b.purchaseCount) { #less }
        else if (a.purchaseCount < b.purchaseCount) { #greater }
        else { #equal };
      });
    { totalTracks; totalPurchases; totalRevenueInCents; topTracks };
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can configure Stripe");
    };
    stripeConfiguration := ?config;
  };

  func getStripeConfigurationInternal() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe is not configured") };
      case (?config) { config };
    };
  };

  public func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfigurationInternal(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can initiate checkout");
    };
    await Stripe.createCheckoutSession(getStripeConfigurationInternal(), caller, items, successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func verifyPaymentAndRecordPurchase(sessionId : Text, trackId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can verify payments");
    };
    let status = await Stripe.getSessionStatus(getStripeConfigurationInternal(), sessionId, transform);
    switch (status) {
      case (#failed { error }) {
        Runtime.trap("Payment verification failed: " # error);
      };
      case (#completed { response }) {
        let track = switch (tracks.get(trackId)) {
          case (null) { Runtime.trap("Track does not exist") };
          case (?track) { track };
        };
        let purchase : Purchase = {
          trackId;
          purchaseDate = Time.now();
          amountPaidInCents = track.priceInCents;
        };
        let existingPurchases = switch (userPurchases.get(caller)) {
          case (null) { Set.empty<Purchase>() };
          case (?purchases) { purchases };
        };
        existingPurchases.add(purchase);
        userPurchases.add(caller, existingPurchases);
      };
    };
  };

  public query ({ caller }) func getUserPurchases() : async [Purchase] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view purchases");
    };
    let purchases = switch (userPurchases.get(caller)) {
      case (null) { Set.empty<Purchase>() };
      case (?purchases) { purchases };
    };
    purchases.toArray().sort();
  };

  public query ({ caller }) func hasPurchasedTrack(trackId : Text, userId : Principal) : async Bool {
    if (caller != userId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only check your own purchases");
    };
    let purchases = switch (userPurchases.get(userId)) {
      case (null) { Set.empty<Purchase>() };
      case (?purchases) { purchases };
    };
    purchases.toArray().any(func(p) { p.trackId == trackId });
  };

  public query ({ caller }) func getTrackAudioFileBlobId(trackId : Text) : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access audio files");
    };
    let track = switch (tracks.get(trackId)) {
      case (null) { Runtime.trap("Track does not exist") };
      case (?track) { track };
    };
    let purchases = switch (userPurchases.get(caller)) {
      case (null) { Set.empty<Purchase>() };
      case (?purchases) { purchases };
    };
    let hasPurchased = purchases.toArray().any(func(p) { p.trackId == trackId });
    if (not hasPurchased) { Runtime.trap("You must purchase this track to download it") };
    track.audioFileBlobId;
  };

  public query ({ caller }) func getTrackCoverArtBlobId(trackId : Text) : async ?Text {
    let track = switch (tracks.get(trackId)) {
      case (null) { Runtime.trap("Track does not exist") };
      case (?track) { track };
    };
    track.coverArtBlobId;
  };
};
