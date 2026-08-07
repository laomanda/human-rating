import {
  ACTIVITY_INTENSITIES,
  OTHER_CATEGORIES,
  PHYSICAL_ACTIVITY_TYPES,
  PRODUCTIVE_CATEGORIES,
  SLEEP_QUALITIES,
} from "@/features/activities/types";

import type {
  ActivityFieldErrors,
  ActivityIntensity,
  OtherCategory,
  PhysicalActivityType,
  ProductiveCategory,
  SleepQuality,
} from "@/features/activities/types";

type ValidationSuccess<T> = {
  success: true;
  data: T;
};

type ValidationFailure = {
  success: false;
  fieldErrors: ActivityFieldErrors;
};

export type ValidationResult<T> =
  | ValidationSuccess<T>
  | ValidationFailure;

export type SleepEntryInput = {
  dailyMatchId: string;
  durationMinutes: number;
  quality: SleepQuality;
  wokeDuringSleep: boolean;
  notes: string | null;
};

export type PhysicalActivityInput = {
  activityId: string | null;
  dailyMatchId: string;
  activityType: PhysicalActivityType;
  customActivityName: string | null;
  intensity: ActivityIntensity;
  reason: string;
};

export type ProductiveActivityInput = {
  activityId: string | null;
  dailyMatchId: string;
  category: ProductiveCategory;
  title: string;
  description: string;
};

export type OtherActivityInput = {
  activityId: string | null;
  dailyMatchId: string;
  category: OtherCategory;
  title: string;
  description: string;
  durationMinutes: number | null;
};

export type DeleteActivityInput = {
  activityId: string;
  dailyMatchId: string;
};

function getString(
  formData: FormData,
  key: string,
): string {
  const value = formData.get(key);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function getBoolean(
  formData: FormData,
  key: string,
): boolean {
  const value = formData.get(key);

  return value === "true" || value === "on" || value === "1";
}

function addError(
  errors: ActivityFieldErrors,
  field: string,
  message: string,
) {
  errors[field] ??= [];
  errors[field].push(message);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isPhysicalActivityType(
  value: string,
): value is PhysicalActivityType {
  return PHYSICAL_ACTIVITY_TYPES.includes(
    value as PhysicalActivityType,
  );
}

function isActivityIntensity(
  value: string,
): value is ActivityIntensity {
  return ACTIVITY_INTENSITIES.includes(
    value as ActivityIntensity,
  );
}

function isProductiveCategory(
  value: string,
): value is ProductiveCategory {
  return PRODUCTIVE_CATEGORIES.includes(
    value as ProductiveCategory,
  );
}

function isOtherCategory(
  value: string,
): value is OtherCategory {
  return OTHER_CATEGORIES.includes(
    value as OtherCategory,
  );
}

function isSleepQuality(
  value: string,
): value is SleepQuality {
  return SLEEP_QUALITIES.includes(
    value as SleepQuality,
  );
}

export function validateSleepEntryForm(
  formData: FormData,
): ValidationResult<SleepEntryInput> {
  const fieldErrors: ActivityFieldErrors = {};

  const dailyMatchId = getString(formData, "daily_match_id");
  const sleepHoursStr = getString(formData, "sleep_hours");
  const qualityStr = getString(formData, "quality");
  const wokeDuringSleep = getBoolean(formData, "woke_during_sleep");
  const notes = getString(formData, "notes");

  if (!isUuid(dailyMatchId)) {
    addError(fieldErrors, "daily_match_id", "Daily Match ID is invalid.");
  }

  const hoursNum = parseFloat(sleepHoursStr);
  if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 24) {
    addError(fieldErrors, "sleep_hours", "Duration must be between 1 and 24 hours.");
  }

  if (!isSleepQuality(qualityStr)) {
    addError(fieldErrors, "quality", "Select a valid sleep quality.");
  }

  if (notes.length > 500) {
    addError(fieldErrors, "notes", "Notes cannot exceed 500 characters.");
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  return {
    success: true,
    data: {
      dailyMatchId,
      durationMinutes: Math.round(hoursNum * 60),
      quality: qualityStr as SleepQuality,
      wokeDuringSleep,
      notes: notes || null,
    },
  };
}

export function validatePhysicalActivityForm(
  formData: FormData,
  options: {
    requireActivityId: boolean;
  },
): ValidationResult<PhysicalActivityInput> {
  const fieldErrors: ActivityFieldErrors = {};

  const activityIdValue = getString(
    formData,
    "activity_id",
  );

  const dailyMatchId = getString(
    formData,
    "daily_match_id",
  );

  const activityTypeValue = getString(
    formData,
    "activity_type",
  );

  const intensityValue = getString(
    formData,
    "intensity",
  );

  const customActivityNameValue = getString(
    formData,
    "custom_activity_name",
  );

  const reason = getString(formData, "reason");

  if (
    options.requireActivityId &&
    !isUuid(activityIdValue)
  ) {
    addError(
      fieldErrors,
      "activity_id",
      "Physical activity ID is invalid.",
    );
  }

  if (!isUuid(dailyMatchId)) {
    addError(
      fieldErrors,
      "daily_match_id",
      "Daily Match ID is invalid.",
    );
  }

  if (!isPhysicalActivityType(activityTypeValue)) {
    addError(
      fieldErrors,
      "activity_type",
      "Select a valid physical activity.",
    );
  }

  if (!isActivityIntensity(intensityValue)) {
    addError(
      fieldErrors,
      "intensity",
      "Select a valid activity intensity.",
    );
  }

  if (reason.length < 5) {
    addError(
      fieldErrors,
      "reason",
      "Reason must contain at least 5 characters.",
    );
  }

  if (reason.length > 500) {
    addError(
      fieldErrors,
      "reason",
      "Reason cannot exceed 500 characters.",
    );
  }

  if (activityTypeValue === "other") {
    if (customActivityNameValue.length < 2) {
      addError(
        fieldErrors,
        "custom_activity_name",
        "Custom activity name must contain at least 2 characters.",
      );
    }

    if (customActivityNameValue.length > 80) {
      addError(
        fieldErrors,
        "custom_activity_name",
        "Custom activity name cannot exceed 80 characters.",
      );
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      fieldErrors,
    };
  }

  return {
    success: true,
    data: {
      activityId:
        options.requireActivityId
          ? activityIdValue
          : null,

      dailyMatchId,

      activityType:
        activityTypeValue as PhysicalActivityType,

      customActivityName:
        activityTypeValue === "other"
          ? customActivityNameValue
          : null,

      intensity:
        intensityValue as ActivityIntensity,

      reason,
    },
  };
}

export function validateProductiveActivityForm(
  formData: FormData,
  options: {
    requireActivityId: boolean;
  },
): ValidationResult<ProductiveActivityInput> {
  const fieldErrors: ActivityFieldErrors = {};

  const activityIdValue = getString(
    formData,
    "activity_id",
  );

  const dailyMatchId = getString(
    formData,
    "daily_match_id",
  );

  const categoryValue = getString(
    formData,
    "category",
  );

  const title = getString(formData, "title");

  const description = getString(
    formData,
    "description",
  );

  if (
    options.requireActivityId &&
    !isUuid(activityIdValue)
  ) {
    addError(
      fieldErrors,
      "activity_id",
      "Productive activity ID is invalid.",
    );
  }

  if (!isUuid(dailyMatchId)) {
    addError(
      fieldErrors,
      "daily_match_id",
      "Daily Match ID is invalid.",
    );
  }

  if (!isProductiveCategory(categoryValue)) {
    addError(
      fieldErrors,
      "category",
      "Select a valid productive category.",
    );
  }

  if (title.length < 3) {
    addError(
      fieldErrors,
      "title",
      "Title must contain at least 3 characters.",
    );
  }

  if (title.length > 120) {
    addError(
      fieldErrors,
      "title",
      "Title cannot exceed 120 characters.",
    );
  }

  if (description.length < 5) {
    addError(
      fieldErrors,
      "description",
      "Description must contain at least 5 characters.",
    );
  }

  if (description.length > 500) {
    addError(
      fieldErrors,
      "description",
      "Description cannot exceed 500 characters.",
    );
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      fieldErrors,
    };
  }

  return {
    success: true,
    data: {
      activityId:
        options.requireActivityId
          ? activityIdValue
          : null,

      dailyMatchId,

      category:
        categoryValue as ProductiveCategory,

      title,
      description,
    },
  };
}

export function validateOtherActivityForm(
  formData: FormData,
  options: {
    requireActivityId: boolean;
  },
): ValidationResult<OtherActivityInput> {
  const fieldErrors: ActivityFieldErrors = {};

  const activityIdValue = getString(formData, "activity_id");
  const dailyMatchId = getString(formData, "daily_match_id");
  const categoryValue = getString(formData, "category");
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const durationStr = getString(formData, "duration_minutes");

  if (options.requireActivityId && !isUuid(activityIdValue)) {
    addError(fieldErrors, "activity_id", "Activity ID is invalid.");
  }

  if (!isUuid(dailyMatchId)) {
    addError(fieldErrors, "daily_match_id", "Daily Match ID is invalid.");
  }

  if (!isOtherCategory(categoryValue)) {
    addError(fieldErrors, "category", "Select a valid category.");
  }

  if (title.length < 3) {
    addError(fieldErrors, "title", "Title must contain at least 3 characters.");
  }

  if (description.length < 5) {
    addError(fieldErrors, "description", "Description must contain at least 5 characters.");
  }

  let durationMinutes: number | null = null;
  if (durationStr) {
    const dur = parseInt(durationStr, 10);
    if (!isNaN(dur) && dur > 0) {
      durationMinutes = dur;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  return {
    success: true,
    data: {
      activityId: options.requireActivityId ? activityIdValue : null,
      dailyMatchId,
      category: categoryValue as OtherCategory,
      title,
      description,
      durationMinutes,
    },
  };
}

export function validateDeleteActivityForm(
  formData: FormData,
): ValidationResult<DeleteActivityInput> {
  const fieldErrors: ActivityFieldErrors = {};

  const activityId = getString(
    formData,
    "activity_id",
  );

  const dailyMatchId = getString(
    formData,
    "daily_match_id",
  );

  if (!isUuid(activityId)) {
    addError(
      fieldErrors,
      "activity_id",
      "Activity ID is invalid.",
    );
  }

  if (!isUuid(dailyMatchId)) {
    addError(
      fieldErrors,
      "daily_match_id",
      "Daily Match ID is invalid.",
    );
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      fieldErrors,
    };
  }

  return {
    success: true,
    data: {
      activityId,
      dailyMatchId,
    },
  };
}