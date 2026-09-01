// Campo de data dd/mm/aaaa com máscara. Guarda o texto como o usuário digitou;
// quem converte para ISO é o `dataParaISO` no submit da tela.

import { StyleSheet, Text, TextInput, View } from 'react-native';

import { mascaraData } from '@/utils/format';

type DateFieldProps = {
  label: string;
  value: string;
  onChangeText: (valor: string) => void;
  placeholder?: string;
  error?: string;
  editable?: boolean;
  helper?: string;
};

export function DateField({
  label,
  value,
  onChangeText,
  placeholder = 'dd/mm/aaaa',
  error,
  editable = true,
  helper,
}: DateFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={(texto) => onChangeText(mascaraData(texto))}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType="numeric"
        maxLength={10}
        editable={editable}
      />

      {helper && !error ? <Text style={styles.helper}>{helper}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
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
  inputError: { borderColor: '#DC2626' },
  helper: { fontSize: 12, color: '#64748B', marginTop: 6 },
  error: { fontSize: 12, color: '#DC2626', marginTop: 6 },
});
