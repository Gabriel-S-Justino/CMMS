// src/components/legal-document-screen.tsx
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "../view/login/termo_e_privacidade/legal-document-screen.style";

export type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalDocumentScreenProps = {
  title: string;
  sections: LegalSection[];
  lastUpdated: string;
};

export function LegalDocumentScreen({
  title,
  sections,
  lastUpdated,
}: LegalDocumentScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backButton}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs.map((paragraph, index) => (
              <Text key={index} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.lastUpdated}>Última atualização: {lastUpdated}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}