import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const createStorySchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  content: z
    .string()
    .min(20, "Content must be at least 20 characters")
    .max(5000, "Content must be less than 5000 characters"),
  lifetime: z.enum(["1h", "3h", "6h", "12h", "1d", "3d", "1w", "2w", "1m"], {
    required_error: "Please select a story lifetime",
  }),
});

type CreateStoryValues = z.infer<typeof createStorySchema>;

export default function CreateStoryModal({
  isOpen,
  onClose,
}: CreateStoryModalProps) {
  const { toast } = useToast();
  const [shareableLink, setShareableLink] = useState<string | null>(null);

  const form = useForm<CreateStoryValues>({
    resolver: zodResolver(createStorySchema),
    defaultValues: {
      title: "",
      content: "",
      lifetime: "1w",
    },
  });

  const { mutate: createStory, isPending } = useMutation({
    mutationFn: async (data: CreateStoryValues) => {
      const res = await apiRequest("POST", "/api/stories", {
        story: {
          title: data.title,
          content: data.content,
        },
        lifetime: data.lifetime,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories/author"] });

      toast({
        title: "Story Created!",
        description: "Your story has been successfully created.",
      });

      // Generate shareable link with the access token
      const shareUrl = `${window.location.origin}/s/${data.accessToken}`;
      setShareableLink(shareUrl);

      // Don't close modal yet, show the shareable link first
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to create story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateStoryValues) => {
    createStory(data);
  };

  const handleClose = () => {
    setShareableLink(null);
    form.reset();
    onClose();
  };

  const copyToClipboard = () => {
    if (!shareableLink) return;

    navigator.clipboard
      .writeText(shareableLink)
      .then(() => {
        toast({
          title: "Link Copied!",
          description: "Story link copied to clipboard.",
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Could not copy the link. Please try again.",
          variant: "destructive",
        });
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a New Story</DialogTitle>
          <DialogDescription>
            Share your creativity with the world. Set a lifetime for how long
            your story will be available.
          </DialogDescription>
        </DialogHeader>

        {shareableLink ? (
          <div className="py-4">
            <h3 className="font-medium text-lg mb-2">
              Your story has been created!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Here's your unique shareable link. You can share this with anyone,
              and they'll be able to view your story even after it expires.
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={shareableLink}
                readOnly
                className="font-mono text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button variant="outline" onClick={copyToClipboard}>
                Copy
              </Button>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Give your story a captivating title"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Type your story here (max 5000 characters)"
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lifetime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Lifetime</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select how long your story will be available" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1h">1 hour</SelectItem>
                        <SelectItem value="3h">3 hours</SelectItem>
                        <SelectItem value="6h">6 hours</SelectItem>
                        <SelectItem value="12h">12 hours</SelectItem>
                        <SelectItem value="1d">1 day</SelectItem>
                        <SelectItem value="3d">3 days</SelectItem>
                        <SelectItem value="1w">1 week</SelectItem>
                        <SelectItem value="2w">2 weeks</SelectItem>
                        <SelectItem value="1m">1 month</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      After this period, your story will no longer be publicly
                      available but will remain in your personal archive.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" type="button" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Story"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
