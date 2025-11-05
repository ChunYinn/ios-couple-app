import React from "react";
import { ViewStyle } from "react-native";
import { CuteDropdown, DropdownOption } from "./CuteDropdown";
import { PRONOUN_OPTIONS } from "../data/pronouns";
import { PronounValue } from "../types/app";

interface PronounSelectProps {
  value: PronounValue | null;
  onChange: (value: PronounValue | null) => void;
  label?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function PronounSelect({
  value,
  onChange,
  label = "Pronouns (optional)",
  disabled = false,
  style,
}: PronounSelectProps) {
  const dropdownOptions: DropdownOption<PronounValue>[] = PRONOUN_OPTIONS.map(
    (pronoun) => ({
      label: pronoun.label,
      value: pronoun.value,
      description: pronoun.description,
    })
  );

  return (
    <CuteDropdown<PronounValue>
      label={label}
      placeholder="Select pronouns"
      value={value}
      options={dropdownOptions}
      onChange={onChange}
      disabled={disabled}
      style={style}
      modalTitle="Select Pronouns"
    />
  );
}