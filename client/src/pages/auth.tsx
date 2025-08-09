import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface AuthPageProps {
  onLogin: (user: User) => void;
  onSwitchToSignUp: () => void;
}

export default function AuthPage({ onLogin, onSwitchToSignUp }: AuthPageProps) {
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  
  const loginForm = useForm({
    defaultValues: {
      username: "",
    },
  });

  // Simple registration schema for basic signup
  const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    displayName: z.string().min(2, "Display name must be at least 2 characters"),
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      displayName: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (userData: { username: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', userData);
      return response.json();
    },
    onSuccess: (user: User) => {
      toast({
        title: "Welcome back!",
        description: `Successfully logged in`,
      });
      onLogin(user);
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: { username: string; displayName: string }) => {
      const response = await apiRequest('POST', '/api/auth/signup', userData);
      return response.json();
    },
    onSuccess: (user: User) => {
      toast({
        title: "Welcome to Globalink!",
        description: `Your Voice ID is ${user.voiceId}`,
      });
      onLogin(user);
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: { username: string }) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: { username: string; displayName: string }) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="pt-8 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Phone className="text-white h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Globalink</h1>
            <p className="text-gray-600">
              {isLogin ? "Welcome back! Sign in to your account" : "Connect instantly with voice calls"}
            </p>
            
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mt-4">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  isLogin
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  !isLogin
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Quick Start
              </button>
            </div>
          </div>
          
          {isLogin ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your username"
                          className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                

                <Button 
                  type="submit" 
                  className="w-full py-3 rounded-xl font-medium"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your username"
                          className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Display Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your display name"
                          className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full py-3 rounded-xl font-medium"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating Account..." : "Get Started"}
                </Button>
              </form>
            </Form>
          )}
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Want to create a full account with more features?
            </p>
            <Button 
              variant="link" 
              onClick={onSwitchToSignUp}
              className="text-primary font-medium"
            >
              Create Full Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
