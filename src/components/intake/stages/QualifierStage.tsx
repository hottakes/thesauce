import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProgressBar } from "../ProgressBar";
import { Search, Check, Instagram, Loader2 } from "lucide-react";

interface School {
  id: string;
  name: string;
  spots_remaining: number;
  is_active: boolean;
}

interface QualifierStageProps {
  onComplete: (data: {
    school: string;
    is19Plus: boolean;
    instagramHandle: string;
  }) => void;
}

export const QualifierStage = ({ onComplete }: QualifierStageProps) => {
  const [step, setStep] = useState(1);
  const [school, setSchool] = useState("");
  const [selectedSchoolData, setSelectedSchoolData] = useState<School | null>(null);
  const [is19Plus, setIs19Plus] = useState<boolean | null>(null);
  const [instagramHandle, setInstagramHandle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

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

  const filteredSchools = schools.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSchoolSelect = (selectedSchool: School) => {
    setSchool(selectedSchool.name);
    setSelectedSchoolData(selectedSchool);
    setSearchQuery(selectedSchool.name);
    setShowDropdown(false);
  };

  const handleContinue = () => {
    if (step === 1 && school) {
      setStep(2);
    } else if (step === 2 && is19Plus !== null) {
      setStep(3);
    } else if (step === 3 && instagramHandle) {
      onComplete({ school, is19Plus: is19Plus!, instagramHandle });
    }
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
                  No worries — some campaigns are 19+, but most aren't. Let's
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

        {/* Step 3: Instagram Connect */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Instagram className="w-8 h-8" />
              </div>
            </div>

            <h2 className="text-2xl font-display font-bold mb-2 text-center">
              Let's see your social game
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              We'll verify your profile and pull some stats.
              <br />
              Nothing gets posted.
            </p>

            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                @
              </span>
              <input
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value.replace("@", ""))}
                placeholder="yourhandle"
                className="w-full pl-10 pr-4 py-4 rounded-2xl bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <button
              onClick={handleContinue}
              disabled={!instagramHandle}
              className="sauce-button w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Connect & Continue
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};