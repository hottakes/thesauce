import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { ProgressBar } from "../ProgressBar";
import { Search, Check, Instagram, Loader2, CheckCircle, AlertCircle, User } from "lucide-react";
import { toast } from "sonner";

interface School {
  id: string;
  name: string;
  spots_remaining: number;
  is_active: boolean;
}

interface InstagramProfile {
  found: boolean;
  username: string;
  profilePic: string | null;
  followers: number | null;
  verified: boolean;
  error?: string;
}

interface QualifierStageProps {
  onComplete: (data: {
    school: string;
    is19Plus: boolean;
    firstName: string;
    lastName: string;
    email: string;
    instagramHandle: string;
    instagramProfilePic?: string | null;
    instagramFollowers?: number | null;
    instagramVerified?: boolean;
  }) => void;
}

export const QualifierStage = ({ onComplete }: QualifierStageProps) => {
  const [step, setStep] = useState(1);
  const [school, setSchool] = useState("");
  const [selectedSchoolData, setSelectedSchoolData] = useState<School | null>(null);
  const [is19Plus, setIs19Plus] = useState<boolean | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [instagramProfile, setInstagramProfile] = useState<InstagramProfile | null>(null);

  const { data: schools = [], isLoading: schoolsLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as School[];
    },
  });

  const lookupInstagramMutation = useMutation({
    mutationFn: async (username: string): Promise<InstagramProfile> => {
      const { data, error } = await supabase.functions.invoke('instagram-lookup', {
        body: { username },
      });
      if (error) throw error;
      return data as InstagramProfile;
    },
    onSuccess: (data) => {
      setInstagramProfile(data);
      if (!data.found) {
        toast.error("We couldn't find that Instagram account. Please check the handle.");
      }
    },
    onError: () => {
      toast.error("Couldn't verify Instagram right now. You can still continue.");
      setInstagramProfile({
        found: true,
        username: instagramHandle,
        profilePic: null,
        followers: null,
        verified: false,
      });
    },
  });

  const filteredSchools = schools.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSchoolSelect = (selectedSchool: School) => {
    setSchool(selectedSchool.name);
    setSelectedSchoolData(selectedSchool);
    setSearchQuery(selectedSchool.name);
    setShowDropdown(false);
  };

  const handleInstagramLookup = () => {
    if (instagramHandle.length >= 1) {
      lookupInstagramMutation.mutate(instagramHandle);
    }
  };

  const handleContinue = () => {
    if (step === 1 && school) {
      setStep(2);
    } else if (step === 2 && is19Plus !== null) {
      setStep(3);
    } else if (step === 3 && firstName && lastName && email && instagramHandle) {
      // If we haven't looked up the profile yet, do it now
      if (!instagramProfile && !lookupInstagramMutation.isPending) {
        lookupInstagramMutation.mutate(instagramHandle, {
          onSuccess: (data) => {
            setInstagramProfile(data);
            if (data.found) {
              onComplete({
                school,
                is19Plus: is19Plus!,
                firstName,
                lastName,
                email,
                instagramHandle,
                instagramProfilePic: data.profilePic,
                instagramFollowers: data.followers,
                instagramVerified: data.verified,
              });
            }
          },
          onError: () => {
            // Continue anyway on error
            onComplete({
              school,
              is19Plus: is19Plus!,
              firstName,
              lastName,
              email,
              instagramHandle,
            });
          },
        });
      } else if (instagramProfile?.found) {
        onComplete({
          school,
          is19Plus: is19Plus!,
          firstName,
          lastName,
          email,
          instagramHandle,
          instagramProfilePic: instagramProfile.profilePic,
          instagramFollowers: instagramProfile.followers,
          instagramVerified: instagramProfile.verified,
        });
      } else if (instagramProfile && !instagramProfile.found) {
        toast.error("Please enter a valid Instagram handle to continue.");
      }
    }
  };

  const formatFollowers = (count: number | null) => {
    if (count === null) return null;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ProgressBar currentStep={step} totalSteps={3} />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Step 1: School Selection */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md"
          >
            <h2 className="text-2xl font-display font-bold mb-2 text-center">
              Where do you go to school?
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Select your university to check availability
            </p>

            <div className="relative mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search universities..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 glass-card rounded-2xl overflow-hidden z-50 max-h-64 overflow-y-auto"
                >
                  {schoolsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredSchools.length === 0 ? (
                    <div className="px-4 py-3 text-muted-foreground text-center">
                      No schools found
                    </div>
                  ) : (
                    filteredSchools.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSchoolSelect(s)}
                        className="w-full px-4 py-3 text-left hover:bg-primary/10 transition-colors flex items-center justify-between"
                      >
                        <span>{s.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {s.spots_remaining} spots
                          </span>
                          {school === s.name && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </div>

            {school && selectedSchoolData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 rounded-2xl mb-6 text-center"
              >
                <p className="text-sm text-muted-foreground">
                  <span className="text-primary font-medium">{school}</span>
                  {" — "}
                  <span className="text-green-400 font-semibold">
                    {selectedSchoolData.spots_remaining} spots remaining
                  </span>
                </p>
              </motion.div>
            )}

            <button
              onClick={handleContinue}
              disabled={!school}
              className="sauce-button w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Continue
            </button>
          </motion.div>
        )}

        {/* Step 2: Age Check */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md"
          >
            <h2 className="text-2xl font-display font-bold mb-2 text-center">
              Are you 19 or older?
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Some campaigns are age-restricted
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setIs19Plus(true)}
                className={`py-6 rounded-2xl font-semibold text-lg transition-all ${
                  is19Plus === true
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => setIs19Plus(false)}
                className={`py-6 rounded-2xl font-semibold text-lg transition-all ${
                  is19Plus === false
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80"
                }`}
              >
                Not yet
              </button>
            </div>

            {is19Plus === false && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 rounded-2xl mb-6 text-center"
              >
                <p className="text-sm text-muted-foreground">
                  No worries — some campaigns are 19+, but most aren&apos;t. Let&apos;s
                  keep going.
                </p>
              </motion.div>
            )}

            <button
              onClick={handleContinue}
              disabled={is19Plus === null}
              className="sauce-button w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Continue
            </button>
          </motion.div>
        )}

        {/* Step 3: Name & Instagram Connect */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
            </div>

            <h2 className="text-2xl font-display font-bold mb-2 text-center">
              Let&apos;s get to know you
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Tell us your name and connect your socials.
            </p>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full px-4 py-4 rounded-2xl bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full px-4 py-4 rounded-2xl bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Email */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-4 rounded-2xl bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all mb-4"
            />

            {/* Instagram Handle */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                <Instagram className="w-5 h-5" />
              </div>
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  @
                </span>
                <input
                  type="text"
                  value={instagramHandle}
                  onChange={(e) => {
                    setInstagramHandle(e.target.value.replace("@", ""));
                    setInstagramProfile(null);
                  }}
                  onBlur={handleInstagramLookup}
                  placeholder="yourhandle"
                  className="w-full pl-10 pr-12 py-4 rounded-2xl bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {lookupInstagramMutation.isPending && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
                )}
                {instagramProfile?.found && !lookupInstagramMutation.isPending && (
                  <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
                {instagramProfile && !instagramProfile.found && !lookupInstagramMutation.isPending && (
                  <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
                )}
              </div>
            </div>

            {/* Instagram Profile Preview */}
            {instagramProfile?.found && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 rounded-2xl mb-6"
              >
                <div className="flex items-center gap-4">
                  {instagramProfile.profilePic ? (
                    <img
                      src={instagramProfile.profilePic}
                      alt={instagramProfile.username}
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">@{instagramProfile.username}</span>
                      {instagramProfile.verified && (
                        <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
                      )}
                    </div>
                    {instagramProfile.followers !== null && (
                      <p className="text-sm text-muted-foreground">
                        <span className="text-primary font-medium">
                          {formatFollowers(instagramProfile.followers)}
                        </span>{" "}
                        followers
                      </p>
                    )}
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </motion.div>
            )}

            {instagramProfile && !instagramProfile.found && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 rounded-2xl mb-6 border-destructive/50"
              >
                <p className="text-sm text-destructive text-center">
                  We couldn&apos;t find this Instagram account. Please check the handle and try again.
                </p>
              </motion.div>
            )}

            <button
              onClick={handleContinue}
              disabled={!firstName || !lastName || !email || !instagramHandle || lookupInstagramMutation.isPending || Boolean(instagramProfile && !instagramProfile.found)}
              className="sauce-button w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {lookupInstagramMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Connect & Continue"
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
