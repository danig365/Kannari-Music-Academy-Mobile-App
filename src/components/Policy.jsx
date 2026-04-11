import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native'

const sections = [
  {
    title: 'PRIVACY POLICY',
    paragraphs: [
      'Kannari Music Academy (the "Company") is committed to protecting the privacy of its users. This Privacy Policy explains what information we gather, how we use it, and what we do to protect it.',
      'For purposes of this agreement, the terms "we," "us," and "our" refer to the Company. "You" refers to you, as a user of the website.',
    ],
  },
  {
    title: 'I. CONSENT',
    paragraphs: [
      'By accessing our website, you accept our Privacy Policy and Terms of Use, and consent to our collection, storage, use, and disclosure of your personal information as described in this policy.',
      'Whether or not you register or do business with us, this Privacy Policy applies to all users of the website.',
    ],
  },
  {
    title: 'II. INFORMATION WE COLLECT',
    paragraphs: [
      'We may collect both Non-Personal Information and Personal Information. Non-Personal Information includes anonymous usage data, demographics, referring/exit URLs, platform types, and click activity.',
      'Personal Information includes details that can identify you, such as name, address, and email address.',
      'This website uses Google Analytics and cookies to track usage information and improve the quality and operation of the website.',
    ],
    bullets: [
      'Internet Explorer cookie settings',
      'Chrome cookie settings',
      'Firefox cookie settings',
      'Safari cookie settings',
      'For other browsers, consult that browser’s cookie help pages',
    ],
    links: [
      {
        label: 'Internet Explorer',
        url: 'https://support.microsoft.com/en-us/help/17442/windows-internet-explorer-delete-manage-cookies',
      },
      {
        label: 'Chrome',
        url: 'https://support.google.com/accounts/answer/61416',
      },
      {
        label: 'Firefox',
        url: 'https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences',
      },
      {
        label: 'Safari',
        url: 'https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac',
      },
      {
        label: 'Mailchimp Privacy Policy',
        url: 'http://mailchimp.com/legal/privacy/',
      },
    ],
  },
  {
    title: 'III. HOW WE USE AND SHARE INFORMATION',
    paragraphs: [
      'In general, we do not sell, trade, rent, or otherwise share your Personal Information with third parties without your consent, except where necessary for service delivery or legal compliance.',
      'We may use collected data for troubleshooting, support, fraud prevention, service updates, and improving user experience.',
    ],
    bullets: [
      'Troubleshooting and diagnostics',
      'Providing requested services and support',
      'Improving website usability',
      'Service and business communications',
      'Fraud prevention and security',
    ],
  },
  {
    title: 'IV. HOW WE PROTECT INFORMATION',
    paragraphs: [
      'We implement reasonable precautions and follow industry best practices to protect your Personal Information. However, no method of transmission or storage is completely secure.',
    ],
  },
  {
    title: 'V. YOUR RIGHTS REGARDING PERSONAL INFORMATION',
    paragraphs: [
      'You may restrict how your personal information is used for marketing and may request corrections to inaccurate information.',
      'We do not sell, distribute, or lease your personal information to third parties unless permitted by law or with your consent.',
    ],
  },
  {
    title: 'VI. HOSTING',
    paragraphs: [
      'Our website is hosted by InMotion Hosting, Inc. Your information may be stored through InMotion Hosting servers according to their privacy policy.',
    ],
  },
  {
    title: 'VII. LINKS TO OTHER WEBSITES',
    paragraphs: [
      'Our website may contain links to third-party websites or apps. We are not responsible for their privacy practices. Please review their policies before use.',
    ],
  },
  {
    title: 'VIII. AGE OF CONSENT',
    paragraphs: ['By using the website, you represent that you are at least 18 years of age.'],
  },
  {
    title: 'IX. CHANGES TO OUR PRIVACY POLICY',
    paragraphs: [
      'We may update this Privacy Policy and Terms of Use from time to time. Continued use of the website after updates means you accept the revised policy.',
    ],
  },
  {
    title: 'X. MERGER OR ACQUISITION',
    paragraphs: [
      'If the Company undergoes a merger, acquisition, or sale of assets, your Personal Information may be transferred as part of that transaction.',
    ],
  },
  {
    title: 'XI. CONTACT US & WITHDRAWING CONSENT',
    paragraphs: [
      'If you have questions about this Privacy Policy or want to withdraw consent for continued collection, use, or disclosure of your Personal Information, contact us by email.',
    ],
  },
  {
    title: 'XII. LAST UPDATED',
    paragraphs: ['This Privacy Policy was last updated on Monday, March 17, 2023.'],
  },
]

const Policy = () => {
  const openLink = async (url) => {
    try {
      await Linking.openURL(url)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {sections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>

          {section.paragraphs?.map((paragraph, paragraphIndex) => (
            <Text key={paragraphIndex} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}

          {section.bullets?.map((bullet, bulletIndex) => (
            <Text key={bulletIndex} style={styles.bullet}>
              • {bullet}
            </Text>
          ))}

          {section.links?.length > 0 && (
            <View style={styles.linkGroup}>
              {section.links.map((link, linkIndex) => (
                <TouchableOpacity key={linkIndex} onPress={() => openLink(link.url)}>
                  <Text style={styles.linkText}>{link.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 10,
  },
  bullet: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    marginBottom: 6,
  },
  linkGroup: {
    marginTop: 8,
    gap: 6,
  },
  linkText: {
    fontSize: 14,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
})

export default Policy
