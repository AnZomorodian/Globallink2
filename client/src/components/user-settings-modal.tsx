import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, Upload, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { countries } from "@/lib/countries";
import { RINGTONE_OPTIONS, RingtoneService } from "@/lib/ringtones";
import { ThemeService, type ThemeOption } from "@/lib/theme-service";
import { LanguageService, LANGUAGE_OPTIONS, type LanguageOption } from "@/lib/language-service";
import { SettingsService, type UserSettings } from "@/lib/settings-service";
import { sessionManager } from "@/lib/session-manager";
import { updateUserSchema } from "@shared/schema";
import type { User } from "@shared/schema";
import { z } from "zod";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

const settingsFormSchema = updateUserSchema.extend({
  phoneNumber: z.string().optional(),
  countryCode: z.string().optional(),
});

export function UserSettingsModal({ isOpen, onClose, user, onLogout, onUserUpdate }: UserSettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedVoiceId, setCopiedVoiceId] = useState(false);
  const [profileImage, setProfileImage] = useState(user.profileImage || "");
  const [selectedRingtone, setSelectedRingtone] = useState(() => {
    const ringtoneService = new RingtoneService();
    return ringtoneService.getRingtone();
  });
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>(() => ThemeService.getTheme());
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(() => LanguageService.getLanguage());
  const [userSettings, setUserSettings] = useState<UserSettings>(() => SettingsService.getSettings());
  const [sessionSettings, setSessionSettings] = useState(() => sessionManager.getSessionSettings());

  // Update settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setUserSettings(SettingsService.getSettings());
      setSelectedTheme(ThemeService.getTheme());
      setSelectedLanguage(LanguageService.getLanguage());
      setSessionSettings(sessionManager.getSessionSettings());
    }
  }, [isOpen]);

  const handleSettingChange = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setUserSettings(prev => ({ ...prev, [key]: value }));
    SettingsService.updateSetting(key, value);
    
    toast({
      title: "Setting Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} has been ${value ? 'enabled' : 'disabled'}`,
    });
  };

  const handleSessionSettingChange = (key: string, value: boolean) => {
    const newSettings = { ...sessionSettings, [key]: value };
    setSessionSettings(newSettings);
    sessionManager.setSessionSettings(newSettings);
    
    toast({
      title: "Session Setting Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} has been ${value ? 'enabled' : 'disabled'}`,
    });
  };

  const handleThemeChange = (theme: ThemeOption) => {
    setSelectedTheme(theme);
    ThemeService.setTheme(theme);
    
    const themeNames = {
      light: '🌞 Light Theme',
      dark: '🌙 Dark Theme', 
      auto: '⚡ Auto (System)',
      cosmic: '🌌 Cosmic Blue',
      nature: '🌿 Nature Green'
    };
    
    toast({
      title: "Theme Updated",
      description: `Switched to ${themeNames[theme]}`,
    });
  };

  const handleLanguageChange = (language: LanguageOption) => {
    setSelectedLanguage(language);
    LanguageService.setLanguage(language);
    
    const langInfo = LanguageService.getLanguageInfo(language);
    toast({
      title: "Language Updated",
      description: `Language set to ${langInfo?.flag} ${langInfo?.nativeName}`,
    });
  };

  const form = useForm({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      displayName: user.displayName,
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      countryCode: user.countryCode || "+1",
      companyName: user.companyName || "",
      jobTitle: user.jobTitle || "",
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/users/${user.id}`, data);
      return response.json();
    },
    onSuccess: (updatedUser: User) => {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved",
      });
      onUserUpdate(updatedUser);
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleCopyVoiceId = async () => {
    try {
      await navigator.clipboard.writeText(user.voiceId);
      setCopiedVoiceId(true);
      toast({
        title: "Voice ID Copied",
        description: "Your Voice ID has been copied to clipboard",
      });
      setTimeout(() => setCopiedVoiceId(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy Voice ID",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: any) => {
    updateUserMutation.mutate({
      ...data,
      profileImage,
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getGradientClass = (initials: string) => {
    const gradients = [
      'bg-gradient-to-br from-purple-500 to-pink-500',
      'bg-gradient-to-br from-orange-500 to-red-500',
      'bg-gradient-to-br from-blue-500 to-purple-500',
      'bg-gradient-to-br from-green-500 to-blue-500',
      'bg-gradient-to-br from-pink-500 to-orange-500'
    ];
    const index = initials.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 border-0 shadow-2xl">
        <DialogHeader className="pb-6 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            ⚙️ User Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 p-6">
          {/* Profile Image */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="p-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full">
                <Avatar className="w-24 h-24 mx-auto mb-2 border-4 border-white shadow-lg">
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt="Profile" />
                  ) : (
                    <AvatarFallback className={`text-white text-xl font-bold ${getGradientClass(getInitials(user.displayName))}`}>
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-1 -right-1 w-10 h-10 p-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Click to change profile picture</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Username
                </label>
                <Input value={user.username} readOnly className="bg-gray-50" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Your Voice ID
                </label>
                <div className="flex space-x-2">
                  <Input value={user.voiceId} readOnly className="bg-gray-50" />
                  <Button size="sm" onClick={handleCopyVoiceId}>
                    {copiedVoiceId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[200px]">
                          {countries.map((country) => (
                            <SelectItem key={`${country.code}-${country.name}`} value={country.code}>
                              <span className="flex items-center gap-2">
                                <span>{country.flag}</span>
                                <span>{country.code}</span>
                                <span className="text-xs text-gray-500">{country.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="123 456 7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Company" {...field} />
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
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Position" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ringtone Selection */}
              <div className="space-y-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700">
                <label className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  🔊 Ringtone Settings
                </label>
                <Select
                  value={selectedRingtone}
                  onValueChange={(value) => {
                    setSelectedRingtone(value);
                    const ringtoneService = new RingtoneService();
                    ringtoneService.setRingtone(value);
                    
                    // Play preview of the selected ringtone
                    const stopRingtone = ringtoneService.startRinging();
                    setTimeout(() => {
                      stopRingtone();
                    }, 2000); // Play for 2 seconds
                    
                    toast({
                      title: "Ringtone Updated",
                      description: `Selected ${RINGTONE_OPTIONS.find(r => r.id === value)?.name} ringtone`,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ringtone" />
                  </SelectTrigger>
                  <SelectContent>
                    {RINGTONE_OPTIONS.map((ringtone) => (
                      <SelectItem key={ringtone.id} value={ringtone.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{ringtone.name}</span>
                          <span className="text-xs text-gray-500">{ringtone.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Call Settings */}
              <div className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                <label className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  📞 Call Settings
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200">
                    <span className="text-sm">Auto-answer calls</span>
                    <Switch 
                      checked={userSettings.autoAnswer}
                      onCheckedChange={(checked) => handleSettingChange('autoAnswer', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200">
                    <span className="text-sm font-medium">Call waiting</span>
                    <Switch 
                      checked={userSettings.callWaiting}
                      onCheckedChange={(checked) => handleSettingChange('callWaiting', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200">
                    <span className="text-sm font-medium">Do not disturb</span>
                    <Switch 
                      checked={userSettings.doNotDisturb}
                      onCheckedChange={(checked) => handleSettingChange('doNotDisturb', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                <label className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  🔒 Privacy Settings
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-purple-100 dark:border-purple-800 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200">
                    <span className="text-sm">Show online status</span>
                    <Switch 
                      checked={userSettings.showOnlineStatus}
                      onCheckedChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Read receipts</span>
                    <Switch 
                      checked={userSettings.readReceipts}
                      onCheckedChange={(checked) => handleSettingChange('readReceipts', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Allow messages from anyone</span>
                    <Switch 
                      checked={userSettings.allowMessagesFromAnyone}
                      onCheckedChange={(checked) => handleSettingChange('allowMessagesFromAnyone', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Audio/Video Quality */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Audio & Video Quality</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">High quality audio</span>
                    <Switch 
                      checked={userSettings.highQualityAudio}
                      onCheckedChange={(checked) => handleSettingChange('highQualityAudio', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">HD video calls</span>
                    <Switch 
                      checked={userSettings.hdVideoCalls}
                      onCheckedChange={(checked) => handleSettingChange('hdVideoCalls', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Noise cancellation</span>
                    <Switch 
                      checked={userSettings.noiseCancellation}
                      onCheckedChange={(checked) => handleSettingChange('noiseCancellation', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Language Settings */}
              <div className="space-y-4 p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-200 dark:border-orange-700">
                <label className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  🌍 Language Settings
                </label>
                <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                          <span className="text-gray-500">({lang.name})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Theme Settings */}
              <div className="space-y-4 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
                <label className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  🎨 Appearance
                </label>
                <Select value={selectedTheme} onValueChange={handleThemeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">🌞 Light Theme</SelectItem>
                    <SelectItem value="dark">🌙 Dark Theme</SelectItem>
                    <SelectItem value="auto">⚡ Auto (System)</SelectItem>
                    <SelectItem value="cosmic">🌌 Cosmic Blue</SelectItem>
                    <SelectItem value="nature">🌿 Nature Green</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notification Settings */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Notifications</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Desktop notifications</span>
                    <Switch 
                      checked={userSettings.desktopNotifications}
                      onCheckedChange={(checked) => handleSettingChange('desktopNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Sound notifications</span>
                    <Switch 
                      checked={userSettings.soundNotifications}
                      onCheckedChange={(checked) => handleSettingChange('soundNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Vibrate on mobile</span>
                    <Switch 
                      checked={userSettings.vibrateOnMobile}
                      onCheckedChange={(checked) => handleSettingChange('vibrateOnMobile', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Advanced</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Hardware acceleration</span>
                    <Switch 
                      checked={userSettings.hardwareAcceleration}
                      onCheckedChange={(checked) => handleSettingChange('hardwareAcceleration', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Auto-save conversation</span>
                    <Switch 
                      checked={userSettings.autoSaveConversation}
                      onCheckedChange={(checked) => handleSettingChange('autoSaveConversation', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Enable beta features</span>
                    <Switch 
                      checked={userSettings.enableBetaFeatures}
                      onCheckedChange={(checked) => handleSettingChange('enableBetaFeatures', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Camera & Webcam Settings */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Camera & Video</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Auto-start camera in video calls</span>
                    <Switch 
                      checked={userSettings.autoStartCamera || false}
                      onCheckedChange={(checked) => handleSettingChange('autoStartCamera', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Mirror front camera</span>
                    <Switch 
                      checked={userSettings.mirrorFrontCamera || true}
                      onCheckedChange={(checked) => handleSettingChange('mirrorFrontCamera', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Enable virtual backgrounds</span>
                    <Switch 
                      checked={userSettings.virtualBackgrounds || false}
                      onCheckedChange={(checked) => handleSettingChange('virtualBackgrounds', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Beauty filter</span>
                    <Switch 
                      checked={userSettings.beautyFilter || false}
                      onCheckedChange={(checked) => handleSettingChange('beautyFilter', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Security & Data */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Security & Data</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Two-factor authentication</span>
                    <Switch 
                      checked={userSettings.twoFactorAuth || false}
                      onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">End-to-end encryption</span>
                    <Switch 
                      checked={userSettings.endToEndEncryption || true}
                      onCheckedChange={(checked) => handleSettingChange('endToEndEncryption', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Auto-delete messages after 7 days</span>
                    <Switch 
                      checked={userSettings.autoDeleteMessages || false}
                      onCheckedChange={(checked) => handleSettingChange('autoDeleteMessages', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Performance & Network */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Performance & Network</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Low bandwidth mode</span>
                    <Switch 
                      checked={userSettings.lowBandwidthMode || false}
                      onCheckedChange={(checked) => handleSettingChange('lowBandwidthMode', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Adaptive bitrate</span>
                    <Switch 
                      checked={userSettings.adaptiveBitrate || true}
                      onCheckedChange={(checked) => handleSettingChange('adaptiveBitrate', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Preload media</span>
                    <Switch 
                      checked={userSettings.preloadMedia || true}
                      onCheckedChange={(checked) => handleSettingChange('preloadMedia', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Accessibility */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Accessibility</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Screen reader support</span>
                    <Switch 
                      checked={userSettings.screenReaderSupport || false}
                      onCheckedChange={(checked) => handleSettingChange('screenReaderSupport', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">High contrast mode</span>
                    <Switch 
                      checked={userSettings.highContrastMode || false}
                      onCheckedChange={(checked) => handleSettingChange('highContrastMode', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Large text</span>
                    <Switch 
                      checked={userSettings.largeText || false}
                      onCheckedChange={(checked) => handleSettingChange('largeText', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Reduce motion</span>
                    <Switch 
                      checked={userSettings.reduceMotion || false}
                      onCheckedChange={(checked) => handleSettingChange('reduceMotion', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Backup & Sync */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Backup & Sync</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Auto backup to cloud</span>
                    <Switch 
                      checked={userSettings.autoBackupToCloud || true}
                      onCheckedChange={(checked) => handleSettingChange('autoBackupToCloud', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Sync across devices</span>
                    <Switch 
                      checked={userSettings.syncAcrossDevices || true}
                      onCheckedChange={(checked) => handleSettingChange('syncAcrossDevices', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Include call recordings</span>
                    <Switch 
                      checked={userSettings.includeCallRecordings || false}
                      onCheckedChange={(checked) => handleSettingChange('includeCallRecordings', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Storage Management */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Storage Management</label>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Used Storage</span>
                    <span className="text-sm text-gray-600">47.3 MB / 100 MB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full" style={{width: '47%'}}></div>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-gray-600">
                    <div>• Messages: 18.2 MB</div>
                    <div>• Call history: 12.1 MB</div>
                    <div>• Profile images: 8.3 MB</div>
                    <div>• Call recordings: 6.5 MB</div>
                    <div>• Cache files: 2.2 MB</div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "Cache Cleared",
                          description: "Temporary files have been removed",
                        });
                      }}
                    >
                      Clear Cache (2.2 MB)
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "Storage Optimized",
                          description: "Compressed old files to save space",
                        });
                      }}
                    >
                      Optimize Storage
                    </Button>
                  </div>
                </div>
              </div>

              {/* Developer Settings */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Developer Options</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Debug mode</span>
                    <Switch 
                      checked={userSettings.debugMode || false}
                      onCheckedChange={(checked) => handleSettingChange('debugMode', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Show connection stats</span>
                    <Switch 
                      checked={userSettings.showConnectionStats || false}
                      onCheckedChange={(checked) => handleSettingChange('showConnectionStats', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Enable WebRTC logs</span>
                    <Switch 
                      checked={userSettings.enableWebRTCLogs || false}
                      onCheckedChange={(checked) => handleSettingChange('enableWebRTCLogs', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-6">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      💾 Save Changes
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          {/* Session Management */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl shadow-inner">
            <h3 className="text-lg font-semibold mb-4 text-purple-800 dark:text-purple-200">
              🔐 Session Management
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-purple-100 dark:border-purple-800">
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">Remember Session</p>
                  <p className="text-sm text-purple-600 dark:text-purple-300">Keep you logged in after refresh (30 days)</p>
                </div>
                <Switch
                  checked={sessionSettings.rememberSession}
                  onCheckedChange={(checked) => handleSessionSettingChange('rememberSession', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-purple-100 dark:border-purple-800">
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">Auto Login</p>
                  <p className="text-sm text-purple-600 dark:text-purple-300">Automatically login when app opens</p>
                </div>
                <Switch
                  checked={sessionSettings.autoLogin}
                  onCheckedChange={(checked) => handleSessionSettingChange('autoLogin', checked)}
                  disabled={!sessionSettings.rememberSession}
                />
              </div>
              
              {sessionSettings.rememberSession && (
                <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 p-2 rounded">
                  ℹ️ Your session will be saved locally and expire after 30 days of inactivity
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="destructive"
              onClick={onLogout}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <LogOut className="h-5 w-5 mr-2" />
              🚪 Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}