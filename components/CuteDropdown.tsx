import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { usePalette } from "../hooks/usePalette";
import { CuteText } from "./CuteText";

export interface DropdownOption<T = string> {
  label: string;
  value: T;
  description?: string;
}

interface CuteDropdownProps<T = string> {
  label?: string;
  placeholder?: string;
  value: T | null;
  options: DropdownOption<T>[];
  onChange: (value: T | null) => void;
  disabled?: boolean;
  style?: ViewStyle;
  dropdownStyle?: ViewStyle;
  labelStyle?: TextStyle;
  modalTitle?: string;
}

export function CuteDropdown<T = string>({
  label,
  placeholder = "Select an option",
  value,
  options,
  onChange,
  disabled = false,
  style,
  dropdownStyle,
  labelStyle,
  modalTitle,
}: CuteDropdownProps<T>) {
  const palette = usePalette();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  const handleSelect = (option: DropdownOption<T>) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <View style={style}>
      {label && (
        <CuteText weight="bold" style={[{ marginBottom: 8 }, labelStyle]}>
          {label}
        </CuteText>
      )}

      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        style={[
          styles.dropdownButton,
          {
            backgroundColor: palette.card,
            borderColor: palette.border,
            opacity: disabled ? 0.5 : 1,
          },
          dropdownStyle,
        ]}
      >
        <CuteText
          style={{
            flex: 1,
            color: selectedOption ? palette.text : palette.textSecondary,
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </CuteText>
        <MaterialIcons
          name={isOpen ? "arrow-drop-up" : "arrow-drop-down"}
          size={24}
          color={palette.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: palette.card,
                borderColor: palette.border,
                shadowColor: palette.text,
              },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: palette.border },
              ]}
            >
              <CuteText weight="bold" style={{ fontSize: 16 }}>
                {modalTitle || "Select Option"}
              </CuteText>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={palette.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    {
                      backgroundColor:
                        item.value === value
                          ? palette.primarySoft
                          : palette.card,
                      borderRadius: 12,
                    },
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <View style={styles.optionContent}>
                    <CuteText
                      weight={item.value === value ? "bold" : undefined}
                      style={{
                        color: palette.text,
                      }}
                    >
                      {item.label}
                    </CuteText>
                    {item.description && (
                      <CuteText
                        tone="muted"
                        style={{ fontSize: 12, marginTop: 2 }}
                      >
                        {item.description}
                      </CuteText>
                    )}
                  </View>
                  {item.value === value && (
                    <MaterialIcons
                      name="check"
                      size={20}
                      color={palette.text}
                    />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View
                  style={{
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: palette.border,
                  }}
                />
              )}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "70%",
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionsList: {
    maxHeight: 400,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionContent: {
    flex: 1,
    marginRight: 8,
  },
});
