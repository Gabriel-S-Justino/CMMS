import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function TermosScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Termos de Uso</Text>

      <View style={styles.content}>
        <Text style={styles.text}>
          Conteúdo dos Termos de Uso do CMMS.
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