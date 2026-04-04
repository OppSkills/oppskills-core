import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { lightTheme } from '../theme';
import { AppText } from './AppText';
import { FooterSignatureBlock } from './FooterSignatureBlock';
import { PrimaryButton } from './PrimaryButton';
import { ScreenContainer } from './ScreenContainer';

type FlowAction = {
  readonly label: string;
  readonly onPress: () => void;
  readonly tone?: 'primary' | 'secondary' | 'outline';
  readonly loading?: boolean;
  readonly disabled?: boolean;
};

interface FlowScreenTemplateProps extends PropsWithChildren {
  readonly title: string;
  readonly subtitle: string;
  readonly routeLabel: string;
  readonly actions: readonly FlowAction[];
  readonly showFooter?: boolean;
  readonly scrollable?: boolean;
}

export function FlowScreenTemplate({
  title,
  subtitle,
  routeLabel,
  actions,
  children,
  showFooter = true,
  scrollable = true,
}: FlowScreenTemplateProps) {
  return (
    <ScreenContainer scrollable={scrollable}>
      <View style={styles.headerCard}>
        <AppText colorToken="brandPrimaryStrong" style={styles.routeLabel} variant="caption">
          {routeLabel}
        </AppText>
        <AppText style={styles.title} variant="displayH2">
          {title}
        </AppText>
        <AppText colorToken="textSecondary" style={styles.subtitle} variant="body">
          {subtitle}
        </AppText>
      </View>

      {children ? <View style={styles.contentBlock}>{children}</View> : null}

      <View style={styles.actionsBlock}>
        {actions.map((action) => (
          <PrimaryButton
            key={action.label}
            label={action.label}
            onPress={action.onPress}
            style={styles.actionButton}
            tone={action.tone ?? 'primary'}
            {...(typeof action.disabled === 'boolean' ? { disabled: action.disabled } : {})}
            {...(typeof action.loading === 'boolean' ? { loading: action.loading } : {})}
          />
        ))}
      </View>

      {showFooter ? <FooterSignatureBlock compact /> : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    marginTop: lightTheme.spacing[10],
  },
  actionsBlock: {
    marginTop: lightTheme.spacing[16],
  },
  contentBlock: {
    marginTop: lightTheme.spacing[10],
  },
  headerCard: {
    backgroundColor: lightTheme.colors.backgroundSecondary,
    borderColor: lightTheme.colors.surfaceBorder,
    borderRadius: lightTheme.radius.lg,
    borderWidth: 1,
    padding: lightTheme.spacing[20],
  },
  routeLabel: {
    textTransform: 'uppercase',
  },
  subtitle: {
    marginTop: lightTheme.spacing[10],
  },
  title: {
    marginTop: lightTheme.spacing[8],
  },
});
