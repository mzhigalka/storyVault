import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onLoginClick: () => void;
  onCreateStoryClick: () => void;
}

export default function Navbar({
  onLoginClick,
  onCreateStoryClick,
}: NavbarProps) {
  const [location] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <span className="ml-2 text-xl font-bold text-dark">
                StoryVault
              </span>
            </Link>
            <nav className="hidden md:ml-6 md:flex space-x-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location === "/"
                    ? "text-primary"
                    : "text-dark-light hover:bg-light hover:text-dark"
                }`}
              >
                Home
              </Link>
              <Link
                href="/random"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location === "/random"
                    ? "text-primary"
                    : "text-dark-light hover:bg-light hover:text-dark"
                }`}
              >
                Random
              </Link>
              <Link
                href="/expiring"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location === "/expiring"
                    ? "text-primary"
                    : "text-dark-light hover:bg-light hover:text-dark"
                }`}
              >
                Expiring Soon
              </Link>
              <Link
                href="/stats"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location === "/stats"
                    ? "text-primary"
                    : "text-dark-light hover:bg-light hover:text-dark"
                }`}
              >
                Statistics
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
                <div className="ml-3 relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary p-0 h-8 w-8"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={user?.avatar || ""}
                            alt={user?.username || "User"}
                          />
                          <AvatarFallback>
                            {user?.username?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/my-stories">My Stories</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onCreateStoryClick}>
                        Create Story
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout}>
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : (
              <div className="md:ml-4 flex">
                <Button
                  variant="outline"
                  onClick={onLoginClick}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-white hover:bg-light"
                >
                  Log in
                </Button>
                <Button
                  onClick={onLoginClick}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                >
                  Sign up
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden ml-2 bg-white p-2 rounded-md text-dark-light hover:text-dark hover:bg-light focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMobileMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              location === "/"
                ? "text-primary"
                : "text-dark-light hover:bg-light hover:text-dark"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/random"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              location === "/random"
                ? "text-primary"
                : "text-dark-light hover:bg-light hover:text-dark"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Random
          </Link>
          <Link
            href="/expiring"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              location === "/expiring"
                ? "text-primary"
                : "text-dark-light hover:bg-light hover:text-dark"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Expiring Soon
          </Link>
          <Link
            href="/stats"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              location === "/stats"
                ? "text-primary"
                : "text-dark-light hover:bg-light hover:text-dark"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Statistics
          </Link>

          {isAuthenticated && (
            <>
              <Link
                href="/my-stories"
                className="block px-3 py-2 rounded-md text-base font-medium text-dark-light hover:bg-light hover:text-dark"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Stories
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onCreateStoryClick();
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-dark-light hover:bg-light hover:text-dark"
              >
                Create Story
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-dark-light hover:bg-light hover:text-dark"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
