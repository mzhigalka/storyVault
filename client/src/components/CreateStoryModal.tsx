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
    .min(3, "Назва повинна бути не менше 3 символів")
    .max(100, "Назва повинна бути менше 100 символів"),
  content: z
    .string()
    .min(20, "Вміст повинен бути щонайменше 20 символів")
    .max(5000, "Вміст повинен бути менше 5000 символів"),
  lifetime: z.enum(["1h", "3h", "6h", "12h", "1d", "3d", "1w", "2w", "1m"], {
    required_error: "Будь ласка, виберіть термін експлуатації історії",
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
        title: "Історія створена!",
        description: "Ваша історія успішно створена.",
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
          error.message ||
          "Не вдалося створити історію.Будь ласка, спробуйте ще раз.",
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
          title: "Посилання скопійовано!",
          description: "Посилання на історію скопіюється на буфер обміну.",
        });
      })
      .catch(() => {
        toast({
          title: "Помилка",
          description:
            "Не міг скопіювати посилання.Будь ласка, спробуйте ще раз.",
          variant: "destructive",
        });
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Створіть нову історію</DialogTitle>
          <DialogDescription>
            Поділіться своєю творчістю зі світом.
          </DialogDescription>
        </DialogHeader>

        {shareableLink ? (
          <div className="py-4">
            <h3 className="font-medium text-lg mb-2">Ваша історія створена!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ось ваше унікальне посилання для обміну.Ви можете поділитися цим з
              будь -ким, І вони зможуть переглянути вашу історію навіть після її
              закінчення.
            </p>
            <div className="flex items-center gap-2">
              <Input
                value={shareableLink}
                readOnly
                className="font-mono text-sm"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button variant="outline" onClick={copyToClipboard}>
                Копіювати
              </Button>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleClose}>Закривати</Button>
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
                    <FormLabel>Заголовок</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Дайте своїй історії захоплюючу назву"
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
                    <FormLabel>Зміст</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Введіть свою історію тут (максимум 5000 символів)"
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
                    <FormLabel>Термін дії історії</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Виберіть, як довго буде доступна ваша історія" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1h">1 година</SelectItem>
                        <SelectItem value="3h">3 годинник</SelectItem>
                        <SelectItem value="6h">6 годинник</SelectItem>
                        <SelectItem value="12h">12 годинник</SelectItem>
                        <SelectItem value="1d">1 день</SelectItem>
                        <SelectItem value="3d">3 дні</SelectItem>
                        <SelectItem value="1w">1 тиждень</SelectItem>
                        <SelectItem value="2w">2 тижня</SelectItem>
                        <SelectItem value="1m">1 місяць</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-1">
                      Після цього періоду ваша історія більше не буде публічно
                      доступний, але залишиться в особистому архіві.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" type="button" onClick={handleClose}>
                  Скасувати
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Створення..." : "Створити історію"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
