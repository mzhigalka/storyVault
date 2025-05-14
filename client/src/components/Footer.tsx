import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Facebook,
  Twitter,
  Instagram,
  Github,
  BookMarked,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Footer() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();

    // This would be connected to a newsletter service in a real app
    toast({
      title: "Subscribed!",
      description: "Thank you for subscribing to our newsletter.",
    });

    setEmail("");
  };

  return (
    <footer className="bg-white border-t border-light">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white">
                <BookMarked className="h-5 w-5" />
              </div>
              <span className="ml-2 text-xl font-bold text-dark">
                StoryVault
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-all">
              Share your short stories with the world and let your creativity
              shine.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-dark tracking-wider uppercase">
              Navigation
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-all hover:text-primary"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/random"
                  className="text-sm text-muted-all hover:text-primary"
                >
                  Random Story
                </Link>
              </li>
              <li>
                <Link
                  href="/expiring"
                  className="text-sm text-muted-all hover:text-primary"
                >
                  Expiring Soon
                </Link>
              </li>
              <li>
                <Link
                  href="/my-stories"
                  className="text-sm text-muted-all hover:text-primary"
                >
                  My Stories
                </Link>
              </li>
              <li>
                <Link
                  href="/stats"
                  className="text-sm text-muted-all hover:text-primary"
                >
                  Statistics
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-dark tracking-wider uppercase">
              Connect With Us
            </h3>
            <div className="mt-4 flex space-x-6">
              <a href="#twitter" className="text-muted-all hover:text-primary">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#facebook" className="text-muted-all hover:text-primary">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#instagram"
                className="text-muted-all hover:text-primary"
              >
                <span className="sr-only">Instagram</span>
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#github" className="text-muted-all hover:text-primary">
                <span className="sr-only">GitHub</span>
                <Github className="h-5 w-5" />
              </a>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-dark tracking-wider uppercase mb-2">
                Subscribe to our newsletter
              </h3>
              <form className="flex" onSubmit={handleSubscribe}>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <Input
                  id="email-address"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Your email"
                  className="w-full min-w-0 rounded-r-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" className="px-4 rounded-l-none">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-light pt-8 flex flex-col md:flex-row justify-between">
          <p className="text-sm text-muted-all">
            &copy; {new Date().getFullYear()} StoryVault. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a
              href="#terms"
              className="text-sm text-muted-all hover:text-primary"
            >
              Terms of Service
            </a>
            <a
              href="#privacy"
              className="text-sm text-muted-all hover:text-primary"
            >
              Privacy Policy
            </a>
            <a
              href="#cookies"
              className="text-sm text-muted-all hover:text-primary"
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
