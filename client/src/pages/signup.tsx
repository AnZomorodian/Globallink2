
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Phone, Eye, EyeOff, ArrowLeft, User as UserIcon, Mail, Lock, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { countries } from "@/lib/countries";
import type { User } from "@shared/schema";

interface SignUpPageProps {
  onSignUp: (user: User) => void;
  onBackToLogin: () => void;
}

export default function SignUpPage({ onSignUp, onBackToLogin }: SignUpPageProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      countryCode: "",
      companyName: "",
      jobTitle: "",
      birthDate: "",
      bio: "",
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (userData: any) => {
      const { confirmPassword, ...dataToSend } = userData;
      const response = await apiRequest('POST', '/api/auth/signup', dataToSend);
      return response.json();
    },
    onSuccess: (user: User) => {
      toast({
        title: "Account Created Successfully!",
        description: `Welcome to Globalink! Your Voice ID is ${user.voiceId}`,
      });
      onSignUp(user);
    },
    onError: (error: any) => {
      toast({
        title: "Sign Up Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    signUpMutation.mutate(data);
  };

  const nextStep = async () => {
    const fieldsToValidate = currentStep === 1 
      ? ["username", "displayName", "email", "password", "confirmPassword"] 
      : [];
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(2);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardContent className="pt-8 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Phone className="text-white h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Globalink</h1>
            <p className="text-gray-600">Create your account to start connecting</p>
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-center mt-6 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 mx-2 ${
                currentStep >= 2 ? 'bg-primary' : 'bg-gray-200'
              }`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 max-w-xs mx-auto">
              <span>Account Info</span>
              <span>Personal Details</span>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            Username
                          </FormLabel>
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
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="How others will see you"
                              className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a password"
                              className="px-4 py-3 pr-12 rounded-xl focus:ring-2 focus:ring-primary"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              className="px-4 py-3 pr-12 rounded-xl focus:ring-2 focus:ring-primary"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your first name"
                              className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your last name"
                              className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date of Birth
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="countryCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Country
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[200px]">
                              {countries.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  <span className="flex items-center gap-2">
                                    <span>{country.flag}</span>
                                    <span>{country.code}</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="Your phone number"
                              className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your company"
                              className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your job title"
                              className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about yourself..."
                            className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <div className="flex justify-between pt-6">
                {currentStep === 1 ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onBackToLogin}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Login
                    </Button>
                    <Button 
                      type="button" 
                      onClick={nextStep}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      Continue
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={signUpMutation.isPending}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      {signUpMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
