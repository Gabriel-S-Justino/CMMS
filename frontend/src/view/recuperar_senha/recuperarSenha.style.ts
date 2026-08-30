import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  keyboardView: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },

  formContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },

  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },

  welcomeText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    marginBottom: 24,
  },

  fieldContainer: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
  },

  inputError: {
    borderColor: '#DC2626',
  },

  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 6,
  },

  recoveryButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  recoveryButtonDisabled: {
    opacity: 0.55,
  },

  recoveryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  backButton: {
    alignSelf: 'center',
    marginTop: 20,
  },

  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
});

