import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PrivacidadeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Política de Privacidade</Text>

      <View style={styles.content}>
        <Text style={styles.text}>
          Conteúdo da Política de Privacidade do CMMS.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },

  content: {
    gap: 16,
  },

  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});