import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TileSelector } from "../TileSelector";
import { ProgressBar } from "../ProgressBar";
import { Upload, Mic, Link, Users, MapPin, Sparkles, Loader2 } from "lucide-react";

interface FormOption {
  id: string;
  label: string;
  emoji: string | null;
  is_active: boolean;
  sort_order: number;
}

interface ProfileBuilderStageProps {
  onComplete: (data: {
    personalityTraits: string[];
    interests: string[];
    householdSize: number;
    sceneTypes: string[];
    sceneCustom: string;
    contentUploaded: boolean;
  }) => void;
  isSaving?: boolean;
}

export const ProfileBuilderStage = ({ onComplete, isSaving = false }: ProfileBuilderStageProps) => {
  const [section, setSection] = useState(1);
  const [personalityTraits, setPersonalityTraits] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [householdSize, setHouseholdSize] = useState(1);
  const [sceneTypes, setSceneTypes] = useState<string[]>([]);
  const [sceneCustom, setSceneCustom] = useState("");
  const [contentUploaded, setContentUploaded] = useState(false);

  const { data: personalityTraitsData = [], isLoading: traitsLoading } = useQuery({
    queryKey: ['personality_traits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personality_traits')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as FormOption[];
    },
  });

  const { data: interestsData = [], isLoading: interestsLoading } = useQuery({
    queryKey: ['interests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as FormOption[];
    },
  });

  const { data: venueTypesData = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['venue_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as FormOption[];
    },
  });

  const personalityOptions = personalityTraitsData.map(t => t.emoji ? `${t.emoji} ${t.label}` : t.label);
  const interestOptions = interestsData.map(i => i.emoji ? `${i.emoji} ${i.label}` : i.label);
  const venueOptions = venueTypesData.map(v => v.emoji ? `${v.emoji} ${v.label}` : v.label);

  const isLoading = traitsLoading || interestsLoading || venuesLoading;

  const toggleTrait = (trait: string) => {
    setPersonalityTraits((prev) =>
      prev.includes(trait)
        ? prev.filter((t) => t !== trait)
        : prev.length < 3
        ? [...prev, trait]
        : prev
    );
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleScene = (scene: string) => {
    setSceneTypes((prev) =>
      prev.includes(scene)
        ? prev.filter((s) => s !== scene)
        : [...prev, scene]
    );
  };

  const handleContinue = () => {
    if (section < 4) {
      setSection(section + 1);
    } else {
      onComplete({
        personalityTraits,
        interests,
        householdSize,
        sceneTypes,
        sceneCustom,
        contentUploaded,
      });
    }
  };

  const canContinue = () => {
    switch (section) {
      case 1:
        return personalityTraits.length > 0;
      case 2:
        return true;
      case 3:
        return sceneTypes.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const sections = [
    { icon: Sparkles, label: "Vibe" },
    { icon: Users, label: "Crew" },
    { icon: MapPin, label: "Scene" },
    { icon: Upload, label: "Flex" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Section Indicators */}
      <div className="px-4 py-4">
        <div className="flex justify-center gap-2 mb-2">
          {sections.map((s, i) => {
            const Icon = s.icon;
            const isActive = section === i + 1;
            const isCompleted = section > i + 1;
            return (
              <div
                key={s.label}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <Icon className="w-3 h-3" />
                {s.label}
              </div>
            );
          })}
        </div>
        <ProgressBar currentStep={section} totalSteps={4} />
      </div>

      <div className="flex-1 flex flex-col px-6 py-4 overflow-y-auto">
        {/* Section A: Your Vibe */}
        {section === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <h2 className="text-2xl font-display font-bold mb-2">
              Pick 3 words that describe you
            </h2>
            <p className="text-muted-foreground mb-6">
              Selected: {personalityTraits.length}/3
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <TileSelector
                  options={personalityOptions}
                  selected={personalityTraits}
                  onSelect={toggleTrait}
                  maxSelect={3}
                  columns={2}
                />

                <div className="mt-8">
                  <h3 className="text-lg font-display font-semibold mb-4">
                    What are you into?
                  </h3>
                  <TileSelector
                    options={interestOptions}
                    selected={interests}
                    onSelect={toggleInterest}
                    columns={3}
                  />
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Section B: Your Crew */}
        {section === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <h2 className="text-2xl font-display font-bold mb-2">
              Who do you live with?
            </h2>
            <p className="text-muted-foreground mb-8">
              Households that apply together get priority
            </p>

            <div className="glass-card p-6 rounded-2xl mb-6">
              <p className="text-sm text-muted-foreground mb-4 text-center">
                How many people in your household?
              </p>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setHouseholdSize(Math.max(1, householdSize - 1))}
                  className="w-12 h-12 rounded-full bg-secondary hover:bg-secondary/80 font-bold text-xl transition-colors"
                >
                  -
                </button>
                <span className="text-4xl font-display font-bold w-16 text-center">
                  {householdSize}
                </span>
                <button
                  onClick={() => setHouseholdSize(Math.min(8, householdSize + 1))}
                  className="w-12 h-12 rounded-full bg-secondary hover:bg-secondary/80 font-bold text-xl transition-colors"
                >
                  +
                </button>
              </div>
              {householdSize === 8 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  8+
                </p>
              )}
            </div>

            {householdSize > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 rounded-2xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Link className="w-5 h-5 text-primary" />
                  <p className="text-sm font-medium">
                    Want to invite your housemates?
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value="sauce.app/join/HOUSE2024"
                    readOnly
                    className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm"
                  />
                  <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                    Copy
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Section C: Your Scene */}
        {section === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <h2 className="text-2xl font-display font-bold mb-2">
              Where do you hang?
            </h2>
            <p className="text-muted-foreground mb-6">
              Select all that apply
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <TileSelector
                options={venueOptions}
                selected={sceneTypes}
                onSelect={toggleScene}
                columns={2}
              />
            )}

            <div className="mt-6">
              <label className="text-sm text-muted-foreground mb-2 block">
                Any specific spots? (optional)
              </label>
              <input
                type="text"
                value={sceneCustom}
                onChange={(e) => setSceneCustom(e.target.value)}
                placeholder="e.g., Wilf's, The Bomber"
                className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </motion.div>
        )}

        {/* Section D: Your Flex */}
        {section === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <h2 className="text-2xl font-display font-bold mb-2">
              Show us what you've got
            </h2>
            <p className="text-muted-foreground mb-6">
              This is optional, but creators who submit content get reviewed first
            </p>

            <div
              onClick={() => setContentUploaded(true)}
              className={`glass-card p-8 rounded-2xl mb-4 text-center cursor-pointer transition-all hover:border-primary/50 ${
                contentUploaded ? "border-primary bg-primary/5" : ""
              }`}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium mb-1">
                {contentUploaded ? "Content ready!" : "Drop your best content"}
              </p>
              <p className="text-sm text-muted-foreground">
                Images or video accepted
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl text-center cursor-pointer hover:border-primary/50 transition-all">
              <Mic className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium mb-1">Record a 30-second pitch</p>
              <p className="text-sm text-muted-foreground">Optional</p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-6 pt-4">
        <button
          onClick={handleContinue}
          disabled={!canContinue() || isSaving}
          className="sauce-button w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              Saving...
            </span>
          ) : section === 4 ? (
            "See My Results"
          ) : (
            "Continue"
          )}
        </button>
        {section > 1 && (
          <button
            onClick={() => setSection(section - 1)}
            className="w-full mt-3 py-3 text-muted-foreground text-sm"
          >
            Go back
          </button>
        )}
      </div>
    </div>
  );
};