import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiGoogle, SiGithub } from "react-icons/si";
import { Eye, EyeOff } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const loginSchema = z.object({
  email: z.string().email({ message: "Введіть дійсну електронну адресу" }),
  password: z
    .string()
    .min(6, { message: "Пароль повинен бути щонайменше 6 символів" }),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z
  .object({
    username: z.string().min(3, {
      message: "Ім'я користувача повинно бути щонайменше 3 символів",
    }),
    email: z.string().email({ message: "Введіть дійсну електронну адресу" }),
    password: z
      .string()
      .min(6, { message: "Пароль повинен бути щонайменше 6 символів" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    login,
    register: registerUser,
    loginWithGoogle,
    loginWithFacebook,
  } = useAuth();

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginValues) => {
    await login(data.email, data.password);
    onClose();
  };

  const onRegisterSubmit = async (data: RegisterValues) => {
    await registerUser(data.username, data.email, data.password);
    onClose();
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    if (provider === "google") {
      window.location.href = "/api/auth/google";
    } else if (provider === "github") {
      window.location.href = "/api/auth/github";
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "login" | "register");
    loginForm.reset();
    registerForm.reset();
  };

  const toggleLoginPassword = () => {
    setShowLoginPassword(!showLoginPassword);
  };

  const toggleRegisterPassword = () => {
    setShowRegisterPassword(!showRegisterPassword);
  };

  const toggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">
            {activeTab === "login"
              ? "Увійдіть у свій обліковий запис"
              : "Створіть новий обліковий запис"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {activeTab === "login"
              ? "Або створити новий обліковий запис, якщо у вас ще немає"
              : "Або увійдіть, якщо у вас вже є обліковий запис"}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="mt-6"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Логін</TabsTrigger>
            <TabsTrigger value="register">Реєстрація</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-6">
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full flex justify-center items-center"
                onClick={() => handleSocialLogin("google")}
              >
                <SiGoogle className="mr-2 text-lg" />
                Продовжуйте з Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full flex justify-center items-center"
                onClick={() => handleSocialLogin("github")}
              >
                <SiGithub className="mr-2 text-lg" />
                Продовжуйте з GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-light"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-muted-all">
                  Або продовжуйте
                </span>
              </div>
            </div>

            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Електронна адреса</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пароль</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="**********"
                            type={showLoginPassword ? "text" : "password"}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={toggleLoginPassword}
                          >
                            {showLoginPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <FormField
                    control={loginForm.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember-me"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <label
                          htmlFor="remember-me"
                          className="text-sm text-dark-light"
                        >
                          Запам'ятати мене
                        </label>
                      </div>
                    )}
                  />

                  <a
                    href="#forgot-password"
                    className="text-sm font-medium text-primary hover:text-primary/80"
                  >
                    Забули пароль?
                  </a>
                </div>

                <Button type="submit" className="w-full">
                  Увійти
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="register" className="space-y-6">
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full flex justify-center items-center"
                onClick={() => handleSocialLogin("google")}
              >
                <SiGoogle className="mr-2 text-lg" />
                Продовжуйте з Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full flex justify-center items-center"
                onClick={() => handleSocialLogin("github")}
              >
                <SiGithub className="mr-2 text-lg" />
                Продовжуйте з GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-light"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-muted-all">
                  Або продовжуйте
                </span>
              </div>
            </div>

            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ім'я користувача</FormLabel>
                      <FormControl>
                        <Input placeholder="Ivan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Електронна адреса</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пароль</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showRegisterPassword ? "text" : "password"}
                            placeholder="**********"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={toggleRegisterPassword}
                          >
                            {showRegisterPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Підтвердити пароль</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="**********"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={toggleConfirmPassword}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Створити обліковий запис
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
