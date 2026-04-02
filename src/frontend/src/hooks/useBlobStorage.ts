import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useEffect, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";
import { useInternetIdentity } from "./useInternetIdentity";

const GATEWAY_VERSION = "v1";

interface BlobStorageConfig {
  storageGatewayUrl: string;
  bucketName: string;
  backendCanisterId: string;
  projectId: string;
  backendHost?: string;
}

let cachedBlobConfig: BlobStorageConfig | null = null;

async function getBlobConfig(): Promise<BlobStorageConfig> {
  if (cachedBlobConfig) return cachedBlobConfig;
  const config = await loadConfig();
  cachedBlobConfig = {
    storageGatewayUrl: config.storage_gateway_url,
    bucketName: config.bucket_name,
    backendCanisterId: config.backend_canister_id,
    projectId: config.project_id,
    backendHost: config.backend_host,
  };
  return cachedBlobConfig;
}

export function useBlobStorage() {
  const { identity } = useInternetIdentity();
  const [blobConfig, setBlobConfig] = useState<BlobStorageConfig | null>(null);

  useEffect(() => {
    getBlobConfig().then(setBlobConfig).catch(console.error);
  }, []);

  const getBlobUrl = useCallback(
    (blobId: string): string => {
      if (!blobConfig) {
        return "";
      }
      const { storageGatewayUrl, backendCanisterId, projectId } = blobConfig;
      return `${storageGatewayUrl}/${GATEWAY_VERSION}/blob/?blob_hash=${encodeURIComponent(blobId)}&owner_id=${encodeURIComponent(backendCanisterId)}&project_id=${encodeURIComponent(projectId)}`;
    },
    [blobConfig],
  );

  const uploadBlob = useCallback(
    async (file: File): Promise<string> => {
      const config = await getBlobConfig();
      // Use new HttpAgent() instead of createSync() to support v3 certificate responses
      const agent = new HttpAgent({
        ...(identity ? { identity } : {}),
        host: config.backendHost,
      });
      if (config.backendHost?.includes("localhost")) {
        await agent.fetchRootKey().catch(console.error);
      }
      const storageClient = new StorageClient(
        config.bucketName,
        config.storageGatewayUrl,
        config.backendCanisterId,
        config.projectId,
        agent,
      );
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await storageClient.putFile(bytes);
      return hash;
    },
    [identity],
  );

  return { getBlobUrl, uploadBlob };
}
