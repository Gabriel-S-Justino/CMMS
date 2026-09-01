import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  keyboardView: {
    flex: 1,
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  header: {
    alignItems: 'center',
    marginBottom: 36,
  },

  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#eff6ff00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  logoIcon: {
  width: 115,
  height: 115,
  borderRadius: 12,
  backgroundColor: '#eff6ff02',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: -30,
},

  logoText: {
    fontSize: 35,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: '#64748B',
  },

  formContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },

  welcomeText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    marginBottom: 28,
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

  passwordContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
  },

  showPasswordButton: {
    paddingHorizontal: 14,
  },

  showPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 24,
  },

  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },

  loginButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loginButtonPressed: {
  opacity: 0.7,
  transform: [{ scale: 0.96 }],
},

  loginButtonDisabled: {
    opacity: 0.55,
  },

  loginButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  footer: {
    alignItems: 'center',
    marginTop: 50,
  },

  footerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },

  footerVersion: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },

  legalLinks: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 0,
},

legalLink: {
  fontSize: 11,
  marginTop: 0,
  color: '#2563EB',
},

legalSeparator: {
  fontSize: 11,
  marginTop: 0,
  color: '#000000',
  marginHorizontal: 8,
},

secondaryActions: {
  flexDirection: 'row',
  alignSelf: 'flex-end',
  gap: 20,
},

secondaryActionsSeparator: {
  fontSize: 10,
  marginTop: -1,
  color: '#2563EB',
  marginHorizontal: -10,
},

errorText: {
  fontSize: 13,
  color: '#DC2626',
  marginTop: 4,
  textAlign: 'center',
},
});