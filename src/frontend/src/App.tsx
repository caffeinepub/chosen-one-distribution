import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsAdmin } from "./hooks/useQueries";
import AboutPage from "./pages/AboutPage";
import AdminPage from "./pages/AdminPage";
import HomePage from "./pages/HomePage";
import LibraryPage from "./pages/LibraryPage";
import TermsPage from "./pages/TermsPage";
import UploadPage from "./pages/UploadPage";

export type Page = "home" | "library" | "admin" | "upload" | "about" | "terms";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [search, setSearch] = useState("");
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "library") setPage("library");
      else if (hash === "admin") setPage("admin");
      else if (hash === "upload") setPage("upload");
      else if (hash === "about") setPage("about");
      else if (hash === "terms") setPage("terms");
      else setPage("home");
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const navigate = (p: Page) => {
    window.location.hash = p === "home" ? "" : p;
    setPage(p);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        currentPage={page}
        navigate={navigate}
        isAuthenticated={isAuthenticated}
        isAdmin={!!isAdmin}
        search={search}
        onSearchChange={setSearch}
      />
      <main className="flex-1">
        {page === "home" && (
          <HomePage
            isAuthenticated={isAuthenticated}
            navigate={navigate}
            search={search}
          />
        )}
        {page === "library" && (
          <LibraryPage isAuthenticated={isAuthenticated} navigate={navigate} />
        )}
        {page === "upload" && <UploadPage />}
        {page === "admin" && (
          <AdminPage
            isAuthenticated={isAuthenticated}
            isAdmin={!!isAdmin}
            isAdminLoading={isAdminLoading}
            navigate={navigate}
          />
        )}
        {page === "about" && <AboutPage />}
        {page === "terms" && <TermsPage />}
      </main>
      <Footer navigate={navigate} />
      <Toaster theme="dark" richColors position="top-right" />
    </div>
  );
}
