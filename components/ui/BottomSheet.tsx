import React, { forwardRef, useCallback, useMemo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import BottomSheetLib, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import { Theme } from '@/constants/Theme';

interface BottomSheetProps {
  children: ReactNode;
  snapPoints?: (string | number)[];
  title?: string;
  onClose?: () => void;
}

export const BottomSheet = forwardRef<BottomSheetLib, BottomSheetProps>(
  ({ children, snapPoints = ['50%', '90%'], title, onClose }, ref) => {
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    return (
      <BottomSheetLib
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.indicator}
        backgroundStyle={styles.background}
        onClose={onClose}
      >
        <BottomSheetView style={styles.content}>
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
            </View>
          )}
          {children}
        </BottomSheetView>
      </BottomSheetLib>
    );
  }
);

// Modal version
interface BottomSheetModalProps extends BottomSheetProps {}

export const BottomSheetModalComponent = forwardRef<BottomSheetModal, BottomSheetModalProps>(
  ({ children, snapPoints = ['50%', '90%'], title, onClose }, ref) => {
    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      []
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.indicator}
        backgroundStyle={styles.background}
        onDismiss={onClose}
      >
        <BottomSheetView style={styles.content}>
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
            </View>
          )}
          {children}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

// Action sheet variant
interface ActionSheetAction {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionSheetProps {
  actions: ActionSheetAction[];
  cancelLabel?: string;
  onCancel?: () => void;
}

export function ActionSheet({ actions, cancelLabel = 'Cancelar', onCancel }: ActionSheetProps) {
  return (
    <View style={styles.actionSheet}>
      <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.actionItem,
              index < actions.length - 1 && styles.actionItemBorder,
              pressed && styles.actionItemPressed,
            ]}
            onPress={action.onPress}
          >
            {action.icon && <View style={styles.actionIcon}>{action.icon}</View>}
            <Text
              style={[
                styles.actionLabel,
                action.destructive && styles.actionLabelDestructive,
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.cancelButton,
          pressed && styles.actionItemPressed,
        ]}
        onPress={onCancel}
      >
        <Text style={styles.cancelLabel}>{cancelLabel}</Text>
      </Pressable>
    </View>
  );
}

export { BottomSheetModalProvider };

const styles = StyleSheet.create({
  background: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
  },
  indicator: {
    backgroundColor: Theme.colors.border,
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
  },
  header: {
    paddingBottom: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    marginBottom: Theme.spacing.lg,
  },
  title: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.text,
    textAlign: 'center',
  },
  actionSheet: {
    padding: Theme.spacing.lg,
  },
  actionsContainer: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: Theme.spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.xl,
  },
  actionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  actionItemPressed: {
    backgroundColor: Theme.colors.backgroundSecondary,
  },
  actionIcon: {
    marginRight: Theme.spacing.md,
  },
  actionLabel: {
    fontSize: Theme.fontSize.lg,
    color: Theme.colors.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  actionLabelDestructive: {
    color: Theme.colors.error,
  },
  cancelButton: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    paddingVertical: Theme.spacing.lg,
    alignItems: 'center',
  },
  cancelLabel: {
    fontSize: Theme.fontSize.lg,
    color: Theme.colors.primary,
    fontWeight: Theme.fontWeight.semibold,
  },
});
