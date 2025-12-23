import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Modal } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UrunEkle = ({ onBack, username }: { onBack: () => void; username: string }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [barcode, setBarcode] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [batchNo, setBatchNo] = useState(''); // Batch No state (string olarak)
  const [isScanning, setIsScanning] = useState(false);

  // Kamera izni talebi
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Barkod değiştiğinde ürün adını getir
  useEffect(() => {
    const fetchProductName = async () => {
      if (!barcode) return;

      try {
        const response = await fetch('https://67be-85-159-70-106.ngrok-free.app/api/getProductNameByBarcode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode: parseInt(barcode) }),
        });

        const data = await response.json();
        if (response.ok) {
          setProductName(data.productName || ''); // Ürün adını ayarla
        } else {
          setProductName(''); // Ürün bulunamadıysa sıfırla
          console.warn(data.message || 'Ürün adı alınamadı.');
        }
      } catch (error) {
        console.error('Ürün adı alınırken hata oluştu:', error);
        setProductName(''); // Hata durumunda ürünü sıfırla
      }
    };

    fetchProductName();
  }, [barcode]); // Barkod değiştiğinde çalışır

  // Barkod tarama işlemi
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setBarcode(data.trim()); // Barkodu ayarla
    setIsScanning(false); // Tarama sonrası kamerayı kapat
    Alert.alert('Barkod Tarandı', `Taranan Barkod: ${data}`);
  };

  // Veriyi sunucuya gönderme
  const handleSubmit = async () => {
    const authToken = await AsyncStorage.getItem('authToken'); // Tokeni alın
    const username = await AsyncStorage.getItem('username');  // Kullanıcı adını alın

    if (!authToken) {
        Alert.alert('Hata', 'Token bulunamadı. Lütfen yeniden giriş yapın.');
        return;
    }

    if (!username) {
        Alert.alert('Hata', 'Kullanıcı adı bulunamadı. Lütfen yeniden giriş yapın.');
        return;
    }

    if (!barcode || !productName || !quantity || !batchNo) {
        Alert.alert('Hata', 'Lütfen tüm alanları doldurun!');
        return;
    }

    try {
        const response = await fetch('https://67be-85-159-70-106.ngrok-free.app/api/urunEkle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`, // Tokeni gönderiyoruz
            },
            body: JSON.stringify({
                barcode: parseInt(barcode.trim()),
                productName: productName.trim(),
                quantity: parseFloat(quantity),
                batchNo: batchNo.trim(),
                username, // Kullanıcı adını gönderiyoruz
            }),
        });

        const data = await response.json();
        if (response.ok) {
            Alert.alert('Başarılı', 'Ürün başarıyla eklendi!');
        } else {
            Alert.alert('Hata', data.message || 'Ürün eklenirken bir hata oluştu.');
        }
    } catch (error) {
        Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
        console.error(error);
    }
};
  

  if (hasPermission === null) {
    return <Text>Kamera izni bekleniyor...</Text>;
  }

  if (hasPermission === false) {
    return <Text>Kamera izni verilmedi!</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Barkod No:</Text>
      <TextInput
        style={styles.input}
        value={barcode}
        onChangeText={setBarcode}
        placeholder="Barkod Numarası"
        keyboardType="numeric"
      />
      <Button title="Barkod Tara" onPress={() => setIsScanning(true)} color="#007AFF" />

      <Text style={styles.label}>Ürün Adı:</Text>
      <TextInput
        style={styles.input}
        value={productName}
        onChangeText={setProductName}
        placeholder="Ürün Adı"
      />

      <Text style={styles.label}>Miktar:</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        placeholder="Miktar"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Batch No:</Text>
      <TextInput
        style={styles.input}
        value={batchNo}
        onChangeText={setBatchNo}
        placeholder="Batch No"
        keyboardType="numeric"
      />

      <Button title="Ürünü Ekle" onPress={handleSubmit} color="#4CAF50" />

      <View style={styles.backButtonTop}>
        <Button title="🔙" onPress={onBack} color="#a1a1a1" />
      </View>

      {isScanning && (
        <Modal visible={isScanning} animationType="slide">
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['ean13'], // Barkod tipi ayarı
              }}
            >
              <View style={styles.overlay}>
                <Button
                  title="Kapat"
                  onPress={() => setIsScanning(false)}
                  color="#FF0000"
                />
              </View>
            </CameraView>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -50 }],
  },
  backButtonTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 50, // Buton genişliği
  },
});

export default UrunEkle;
