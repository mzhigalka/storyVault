import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import AuthorDashboard from "@/pages/AuthorDashboard";
import StoryDetail from "@/pages/StoryDetail";
import Random from "@/pages/Random";
import ExpiringSoon from "@/pages/ExpiringSoon";
import Stats from "@/pages/Stats";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/my-stories" component={AuthorDashboard} />
        <Route path="/story/:id" component={StoryDetail} />
        <Route path="/s/:accessToken" component={StoryDetail} />
        <Route path="/random" component={Random} />
        <Route path="/expiring" component={ExpiringSoon} />
        <Route path="/stats" component={Stats} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
