import { ReactNode, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import StoryViewModal from "./StoryViewModal";
import CreateStoryModal from "./CreateStoryModal";
import LoginModal from "./LoginModal";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [viewStory, setViewStory] = useState<any>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-dark">
      <Navbar 
        onLoginClick={() => setIsLoginModalOpen(true)}
        onCreateStoryClick={() => {
          if (isAuthenticated) {
            setIsCreateModalOpen(true);
          } else {
            setIsLoginModalOpen(true);
          }
        }}
      />
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      
      <Footer />
      
      {/* Modals */}
      <StoryViewModal 
        story={viewStory}
        isOpen={!!viewStory} 
        onClose={() => setViewStory(null)} 
      />
      
      <CreateStoryModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  );
}
