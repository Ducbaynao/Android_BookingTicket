import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ForgotPasswordScreen = () => {
return (
<View style={styles.container}>
<Text style={styles.title}>Forgot Password Screen</Text>
</View>
);
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
container: {
flex: 1,
alignItems: 'center',
justifyContent: 'center',
backgroundColor: '#F7F8FA',
},
title: {
fontSize: 20,
fontWeight: '700',
color: '#111827',
},
});
