import { Text } from "@saleor/macaw-ui/next";
import React from "react";

export const HelperText = ({
  children,
  disabled = false,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  return (
    <Text
      color={disabled ? "textNeutralDisabled" : "textNeutralSubdued"}
      fontWeight={"captionLarge"}
    >
      {children}
    </Text>
  );
};
