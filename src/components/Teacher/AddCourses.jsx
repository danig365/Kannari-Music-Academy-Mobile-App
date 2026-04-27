import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ScrollView, StyleSheet, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import { Picker } from '@react-native-picker/picker'
import * as DocumentPicker from 'expo-document-picker'
import axios from 'axios'

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const AddCourses = () => {
            const navigation = useNavigation()

      const [cats,setCats]=useState([])
      
      const [courseData,setCourseData]=useState({
        category:'',
        title:'',
        description:'',
        f_img:'',
        techs:'',
        required_access_level:'free'
      });

      useEffect(()=>{
        try{
            axios.get(baseUrl+'/category/')
            .then((res)=>{
                    setCats(res.data)
            });
        }catch(error){
            console.log(error)
        }
      },[]);

      const handleChange=(event)=>{
        setCourseData({
            ...courseData,
                        [event.target.name]:event.target.value
        });
      }

            const handleValueChange=(name, value)=>{
                setCourseData({
                        ...courseData,
                        [name]:value
                })
            }

            const handleFileChange=async()=>{
                const result = await DocumentPicker.getDocumentAsync({
                        type: ['image/*'],
                        multiple: false,
                        copyToCacheDirectory: true,
                })

                if (result.canceled) return

                const file = result.assets && result.assets[0]
                if (!file) return

        setCourseData({
            ...courseData,
                        f_img: {
                            uri: file.uri,
                            name: file.name || 'featured-image.jpg',
                            type: file.mimeType || 'image/jpeg',
                        }
        })
      }

            const formSubmit=async()=>{
                const teacherId=await AsyncStorage.getItem('teacherId')
        const _formData=new FormData();
        _formData.append('category',courseData.category);
        _formData.append('teacher',teacherId);
        _formData.append('title',courseData.title);
        _formData.append('description',courseData.description);
                if (courseData.f_img) {
                    _formData.append('featured_img', courseData.f_img)
                }
        _formData.append('techs',courseData.techs);
        _formData.append('required_access_level',courseData.required_access_level);

        try{
            axios.post(baseUrl+'/course/',_formData,{
                headers: {
                    'content-type':'multipart/form-data'
                }
            })
            .then((res)=>{
                                navigation.navigate('AddCourse');
            });
        }catch(error){
            console.log(error);
        }
      };

  return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
                <Text style={styles.cardHeader}>➕ Add Course</Text>
                <View style={styles.cardBody}>
                    <View style={styles.fieldWrap}>
                        <Text style={styles.label}>Category</Text>
                        <View style={styles.pickerWrap}>
                            <Picker
                                selectedValue={courseData.category}
                                onValueChange={(itemValue) => handleValueChange('category', itemValue)}
                            >
                                {cats.map((category, index) => <Picker.Item key={index} label={category.title} value={category.id} />)}
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.fieldWrap}>
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            value={courseData.title}
                            onChangeText={(text) => handleValueChange('title', text)}
                        />
                    </View>

                    <View style={styles.fieldWrap}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            multiline={true}
                            value={courseData.description}
                            onChangeText={(text) => handleValueChange('description', text)}
                        />
                    </View>

                    <View style={styles.fieldWrap}>
                        <Text style={styles.label}>Featured Image</Text>
                        <TouchableOpacity style={styles.fileButton} onPress={handleFileChange}>
                            <Text style={styles.fileButtonText}>{courseData.f_img?.name || 'Choose File'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.fieldWrap}>
                        <Text style={styles.label}>Technologies</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            multiline={true}
                            value={courseData.techs}
                            placeholder='php,Java,C++...'
                            onChangeText={(text) => handleValueChange('techs', text)}
                        />
                    </View>

                    <View style={styles.fieldWrap}>
                        <Text style={styles.label}>🔒 Required Access Level</Text>
                        <View style={styles.pickerWrap}>
                            <Picker
                                selectedValue={courseData.required_access_level}
                                onValueChange={(itemValue) => handleValueChange('required_access_level', itemValue)}
                            >
                                <Picker.Item label='🟢 Free — Anyone can access' value='free' />
                                <Picker.Item label='🔵 Basic — Basic plan or higher' value='basic' />
                                <Picker.Item label='🟣 Standard — Standard plan or higher' value='standard' />
                                <Picker.Item label='🟠 Premium — Premium plan or higher' value='premium' />
                            </Picker>
                        </View>
                        <Text style={styles.helpText}>Students need at least this subscription level to enroll</Text>
                    </View>

                    <TouchableOpacity onPress={formSubmit} style={styles.submitButton}>
                        <Text style={styles.submitButtonText}>Submit</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
  )
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        overflow: 'hidden',
    },
    cardHeader: {
        fontSize: 22,
        fontWeight: '600',
        color: '#1f2937',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    cardBody: {
        padding: 16,
    },
    fieldWrap: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#374151',
        backgroundColor: '#fff',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    pickerWrap: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#fff',
    },
    fileButton: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    fileButtonText: {
        fontSize: 14,
        color: '#374151',
    },
    helpText: {
        marginTop: 6,
        fontSize: 12,
        color: '#6b7280',
    },
    submitButton: {
        marginTop: 8,
        backgroundColor: '#3b82f6',
        borderRadius: 6,
        paddingVertical: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
})

export default  AddCourses
