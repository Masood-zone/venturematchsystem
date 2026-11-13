import "server-only";
import { db } from "@/lib/db";
import { activeSkills, activeSectors, lockProfile } from "@/services/onboarding/service";
import { createProfileService } from "./profile-service";

export const saveProfile = createProfileService(db, { lockProfile, activeSkills, activeSectors });
