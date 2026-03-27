import { ScrollView, ScrollViewProps } from "react-native";
import { PropsWithChildren } from "react";

type Props = PropsWithChildren<ScrollViewProps>;

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = "handled",
  ...props
}: Props) {
  return (
    <ScrollView keyboardShouldPersistTaps={keyboardShouldPersistTaps} {...props}>
      {children}
    </ScrollView>
  );
}
