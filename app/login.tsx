import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GlassPanel } from '@/components/GlassPanel';
import { StatusModal } from '@/components/StatusModal';
import { Colors } from '@/constants/theme';
import api from '@/services/api';
import { LogIn, User, CircleCheck as LucideCircleCheck, QrCode, Keyboard, ImagePlus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { WebView } from 'react-native-webview';

export default function LoginScreen() {
  const [studentId, setStudentId] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const [showManual, setShowManual] = useState(false);
  const [scanned, setScanned] = useState(false);
  
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();

  // Reset scan state when component mounts or mode changes
  useEffect(() => {
    if (!showManual) {
      setScanned(false);
    }
  }, [showManual]);

  const authenticate = async (id: string, t: string) => {
    setLoading(true);
    try {
      const response = await api.post('/api/voter/login/', {
        student_id: id,
        token: t,
      });

      // Save voter data
      await AsyncStorage.setItem('voter_data', JSON.stringify({
        ...response.data,
        token: t, // Store token for future requests
      }));

      router.replace('/dashboard');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to authenticate. Please check your credentials.';
      console.error('Login Error:', error.response?.data || error.message);
      setErrorModal({ visible: true, title: 'Authentication Error', message: msg });
      setScanned(false); // Allow scanning again if it failed
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = async () => {
    if (!studentId || !token) {
      Alert.alert('Required', 'Please enter your Student ID and Voting Token.');
      return;
    }
    await authenticate(studentId, token);
  };

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    try {
      // Expecting QR code format: {"student_id": "2023-00001", "token": "xyz123"}
      // Handle both formats: {"id": "..."} and {"student_id": "..."} to be flexible
      const parsedData = JSON.parse(data);
      const id = parsedData.student_id || parsedData.id;
      const t = parsedData.token;
      
      if (!id || !t) {
        throw new Error('Invalid QR code format');
      }
      
    authenticate(id, t);
    } catch (err) {
      setErrorModal({ visible: true, title: 'Invalid QR Code', message: 'The scanned QR code does not contain valid voting credentials.' });
      setScanned(false);
    }
  };

  const webViewRef = React.useRef<WebView>(null);

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled) {
        setLoading(true);
        const { uri } = result.assets[0];
        
        // Optimize image for decoding (resize to max 800px to avoid memory issues)
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 800 } }],
          { base64: true, format: ImageManipulator.SaveFormat.JPEG }
        );

        if (manipResult.base64 && webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({ base64: manipResult.base64 }));
        }
      }
    } catch (e) {
      console.error('Image Picker Error:', e);
      setErrorModal({ visible: true, title: 'Error', message: 'Failed to process the selected image.' });
      setLoading(false);
    }
  };

  const onWebViewMessage = (event: any) => {
    setLoading(false);
    try {
      const { data } = JSON.parse(event.nativeEvent.data);
      if (data) {
        handleBarCodeScanned({ type: 'qr', data });
      } else {
        setErrorModal({ visible: true, title: 'No QR Code Found', message: 'Could not detect a valid QR code in the selected image.' });
      }
    } catch (e) {
      setErrorModal({ visible: true, title: 'Scan Error', message: 'Failed to decode the QR code from the image.' });
    }
  };

  const webViewHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
    </head>
    <body>
      <canvas id="canvas" style="display:none;"></canvas>
      <script>
        window.addEventListener('message', (event) => {
          try {
            const { base64 } = JSON.parse(event.data);
            const img = new Image();
            img.onload = () => {
              const canvas = document.getElementById('canvas');
              const ctx = canvas.getContext('2d');
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              window.ReactNativeWebView.postMessage(JSON.stringify({ data: code ? code.data : null }));
            };
            img.onerror = () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ data: null, error: 'Image load failed' }));
            };
            img.src = 'data:image/jpeg;base64,' + base64;
          } catch (err) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ data: null, error: err.message }));
          }
        });
      </script>
    </body>
    </html>
  `;

  const toggleMode = async () => {
    if (!showManual && (!permission || !permission.granted)) {
      await requestPermission();
    }
    setShowManual(!showManual);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#1e293b', '#0f172a']}
        style={styles.bgGradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.headerArea}>
              <Text style={styles.title}>SOAVS</Text>
              <Text style={styles.subtitle}>Student Voting Portal</Text>
            </View>

            <GlassPanel style={styles.loginCard} intensity={60}>
              <Text style={styles.cardTitle}>{showManual ? 'Manual Entry' : 'Scan to Vote'}</Text>
              
              {!showManual ? (
                // --- QR SCANNER VIEW ---
                <View style={styles.scannerContainer}>
                  {!permission ? (
                    <View style={styles.permissionContainer}>
                      <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                  ) : !permission.granted ? (
                    <View style={styles.permissionContainer}>
                      <Text style={styles.permissionText}>We need your permission to use the camera</Text>
                      <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                        <Text style={styles.permissionBtnText}>Grant Permission</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.cameraWrapper}>
                      <CameraView 
                        style={styles.camera} 
                        facing="back"
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                        barcodeScannerSettings={{
                          barcodeTypes: ["qr"],
                        }}
                      />
                      {loading && (
                        <View style={styles.loadingOverlay}>
                          <ActivityIndicator size="large" color="#fff" />
                          <Text style={styles.loadingText}>Authenticating...</Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.switchButton} 
                    onPress={handleImageUpload}
                  >
                    <ImagePlus size={20} color={Colors.primary} style={styles.inputIcon} />
                    <Text style={styles.switchButtonText}>Upload from Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.switchButton} 
                    onPress={toggleMode}
                  >
                    <Keyboard size={20} color={Colors.primary} style={styles.inputIcon} />
                    <Text style={styles.switchButtonText}>Enter Token Manually</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // --- MANUAL ENTRY VIEW ---
                <View style={styles.manualContainer}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Student ID</Text>
                    <View style={styles.inputWrapper}>
                      <User size={20} color={Colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 2023-00001"
                        placeholderTextColor="#64748b"
                        value={studentId}
                        onChangeText={setStudentId}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Voting Token</Text>
                    <View style={styles.inputWrapper}>
                      <LogIn size={20} color={Colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter unique token"
                        placeholderTextColor="#64748b"
                        value={token}
                        onChangeText={setToken}
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleManualLogin}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Authorize Access</Text>
                        <LucideCircleCheck size={20} color="#fff" style={{marginLeft: 10}} />
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.switchButton, { marginTop: 20 }]} 
                    onPress={toggleMode}
                  >
                    <QrCode size={20} color={Colors.primary} style={styles.inputIcon} />
                    <Text style={styles.switchButtonText}>Scan QR Code Instead</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <Text style={styles.footerNote}>
                Tokens are provided by your organization administrator.
              </Text>
            </GlassPanel>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>

      <StatusModal 
        visible={errorModal.visible}
        type="error"
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ ...errorModal, visible: false })}
      />

      {/* Hidden WebView for background QR decoding */}
      <View style={{ height: 0, width: 0, opacity: 0, position: 'absolute' }}>
        <WebView
          ref={webViewRef}
          source={{ html: webViewHtml }}
          onMessage={onWebViewMessage}
          javaScriptEnabled={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  loginCard: {
    width: '100%',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  scannerContainer: {
    alignItems: 'center',
  },
  manualContainer: {
    width: '100%',
  },
  cameraWrapper: {
    width: 250,
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  camera: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontWeight: '600',
  },
  permissionContainer: {
    width: 250,
    height: 250,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  permissionBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  switchButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  footerNote: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  }
});
