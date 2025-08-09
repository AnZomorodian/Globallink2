import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Phone, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface UnifiedAuthPageProps {
  onLogin: (user: User) => void;
}

const authSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters").optional(),
});

export default function UnifiedAuthPage({ onLogin }: UnifiedAuthPageProps) {
  const { toast } = useToast();
  const [isExistingUser, setIsExistingUser] = useState<boolean | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: "",
      displayName: "",
    },
  });

  const username = form.watch("username");

  // Check if user exists when username changes
  useEffect(() => {
    const checkUser = async () => {
      if (username && username.length >= 3) {
        setIsCheckingUser(true);
        try {
          const response = await fetch(`/api/auth/check-user/${username}`);
          const exists = response.ok;
          setIsExistingUser(exists);
        } catch (error) {
          setIsExistingUser(false);
        } finally {
          setIsCheckingUser(false);
        }
      } else {
        setIsExistingUser(null);
      }
    };

    const timeoutId = setTimeout(checkUser, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [username]);

  const authMutation = useMutation({
    mutationFn: async (userData: { username: string; displayName?: string }) => {
      const endpoint = isExistingUser ? '/api/auth/login' : '/api/auth/signup';
      const response = await apiRequest('POST', endpoint, userData);
      return response.json();
    },
    onSuccess: (user: User) => {
      toast({
        title: isExistingUser ? "Welcome back!" : "Welcome to Globalink!",
        description: isExistingUser 
          ? "Successfully logged in" 
          : `Your Voice ID is ${user.voiceId}`,
      });
      onLogin(user);
    },
    onError: (error: any) => {
      toast({
        title: "Authentication Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: { username: string; displayName?: string }) => {
    if (!isExistingUser && !data.displayName) {
      form.setError("displayName", { message: "Display name is required for new users" });
      return;
    }
    authMutation.mutate(data);
  };

  const getButtonText = () => {
    if (isCheckingUser) return "Checking...";
    if (isExistingUser === null) return "Enter Username";
    if (isExistingUser) return "Login";
    return "Create Account";
  };

  const getUserStatusText = () => {
    if (isCheckingUser) return "Checking username...";
    if (isExistingUser === true) return "Welcome back! Click to login";
    if (isExistingUser === false) return "New user? We'll create your account";
    return "";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Phone className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Globalink</CardTitle>
          <p className="text-gray-600">Professional Communication Platform</p>
          {getUserStatusText() && (
            <p className="text-sm text-blue-600 mt-2">{getUserStatusText()}</p>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your username"
                        {...field}
                        disabled={authMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isExistingUser === false && (
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your display name"
                          {...field}
                          disabled={authMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={
                  authMutation.isPending || 
                  isCheckingUser || 
                  !username || 
                  username.length < 3 ||
                  (isExistingUser === false && !form.getValues("displayName"))
                }
              >
                {authMutation.isPending ? "Please wait..." : getButtonText()}
              </Button>
            </form>
          </Form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Quick Start:</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Enter username to login or create account</li>
              <li>• Get your Voice ID for calls</li>
              <li>• Make voice/video calls with contacts</li>
              <li>• Send messages via messenger interface</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}