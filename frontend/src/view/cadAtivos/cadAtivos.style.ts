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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  },

  stepCounter: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },

  progressContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 28,
  },

  progressItem: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },

  progressItemActive: {
    backgroundColor: '#2563EB',
  },

  formContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },

  sectionDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    marginBottom: 24,
  },

  subsectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 16,
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

  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
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

  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  selectButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },

  selectButtonActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },

  selectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },

  selectButtonTextActive: {
    color: '#2563EB',
  },

  optionsContainer: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  optionButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  optionButtonActive: {
    backgroundColor: '#EFF6FF',
  },

  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: 10,
  },

  radioActive: {
    borderColor: '#2563EB',
    backgroundColor: '#2563EB',
  },

  optionText: {
    fontSize: 14,
    color: '#475569',
  },

  optionTextActive: {
    fontWeight: '600',
    color: '#2563EB',
  },

  infoText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 14,
  },

  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
    paddingBottom: 16,
  },

  backButton: {
    minHeight: 52,
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },

  nextButton: {
    minHeight: 52,
    flex: 1.5,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  buttonDisabled: {
    opacity: 0.55,
  },
});