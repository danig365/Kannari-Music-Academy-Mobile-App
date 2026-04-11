import React, { useState } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'

const SearchInput = () => {
  const [searchText, setSearchText] = useState('')
  const navigation = useNavigation()

  const handleSearch = () => {
    if (searchText.trim()) {
      navigation.navigate('Search', { searchstring: searchText.trim() })
      setSearchText('')
    }
  }

  return (
    <View style={styles.inputBox}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        placeholder="Search courses..."
        value={searchText}
        onChangeText={setSearchText}
        onSubmitEditing={handleSearch}
        placeholderTextColor="#999"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleSearch}
      >
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 76,
    maxWidth: 900,
    width: '100%',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 8,
    paddingHorizontal: 20,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  icon: {
    fontSize: 30,
    color: '#707070',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#333',
    paddingVertical: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 6,
    backgroundColor: '#06BBCC',
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
})

export default SearchInput
