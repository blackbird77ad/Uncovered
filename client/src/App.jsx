import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import CommunityPage from "./pages/CommunityPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import PodcastPage from "./pages/PodcastPage.jsx";
import PodcastDetailPage from "./pages/PodcastDetailPage.jsx";
import PoliciesPage from "./pages/PoliciesPage.jsx";
import StoriesPage from "./pages/StoriesPage.jsx";
import StoryDetailPage from "./pages/StoryDetailPage.jsx";
import SubmitStoryPage from "./pages/SubmitStoryPage.jsx";
import TrustPage from "./pages/TrustPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route
          path="/stories"
          element={<StoriesPage title="Latest Stories" subtitle="Stories, voice readings, and podcast episodes approved for the public feed." includePodcasts />}
        />
        <Route
          path="/faceless-voices"
          element={<StoriesPage title="Faceless Voices" subtitle="Anonymous submissions protected from intake through publication." vertical="faceless" />}
        />
        <Route
          path="/trending"
          element={<StoriesPage title="Trending" subtitle="Stories and episodes readers are liking, saving, and sharing." sort="trending" includePodcasts />}
        />
        <Route path="/podcast" element={<PodcastPage />} />
        <Route path="/podcast/:slugOrId" element={<PodcastDetailPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/trust" element={<TrustPage />} />
        <Route path="/policies" element={<PoliciesPage />} />
        <Route path="/submit" element={<SubmitStoryPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/stories/:slugOrId" element={<StoryDetailPage />} />
      </Route>
    </Routes>
  );
}
