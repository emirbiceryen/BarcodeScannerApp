import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Modal } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UrunCikar = ({ onBack, username }: { onBack: () => void; username: string }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [barcode, setBarcode] = useState<string>('');
  const [productName, setProductName] = useState<string>(''); // Ürün adı için state
  const [quantity, setQuantity] = useState<string>('');
  const [batchNo, setBatchNo] = useState<string>(''); // Batch No için state ekledik
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Kamera izinlerini isteme
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Barkod okunduğunda çalışacak fonksiyon
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setBarcode(data);
    setIsScanning(false); // Kamera modalını kapat
    Alert.alert('Barkod Tarandı', `Taranan Barkod: ${data}`);

    
    
    // Barkoda göre ürün adı getir
    try {
      const response = await fetch('https://67be-85-159-70-106.ngrok-free.app/api/getProductNameByBarcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: data }),
      });

      const result = await response.json();
      if (response.ok) {
        setProductName(result.productName); // Ürün adını state'e kaydet
      } else {
        setProductName(''); // Ürün adı bulunamazsa boş bırak
        Alert.alert('Hata', result.message || 'Ürün adı alınamadı.');
      }
    } catch (error) {
      setProductName('');
      Alert.alert('Hata', 'Ürün adı alınırken bir sorun oluştu.');
    }
  };

  // Sunucuya istek gönderme
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
        const response = await fetch('https://67be-85-159-70-106.ngrok-free.app/api/urunCikar', {
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
                username, // Burada AsyncStorage'den alınan username'i kullanıyoruz
            }),
        });

        const result = await response.json();
        if (response.ok) {
            Alert.alert('Başarılı', 'Ürün başarıyla çıkarıldı!');
            setBarcode('');
            setProductName(''); // Ürün adı temizlenir
            setQuantity('');
            setBatchNo(''); // Batch no da temizlenir
        } else {
            Alert.alert('Hata', result.message || 'Ürün çıkarma işlemi başarısız.');
        }
    } catch (error) {
        Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
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
        placeholder="Barkod Numarası"
        editable={false}
      />
      <Button title="Barkod Tara" onPress={() => setIsScanning(true)} color="#007AFF" />

      <Text style={styles.label}>Ürün Adı:</Text>
      <TextInput
        style={styles.input}
        value={productName}
        placeholder="Ürün Adı"
        editable={false} // Ürün adı otomatik doldurulacak
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
      />

      <Button title="Ürünü Çıkar" onPress={handleSubmit} color="#4CAF50" />

      {/* Geri Dön Butonu */}
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
                barcodeTypes: ['ean13'], // Barkod türü ihtiyaca göre ayarlanabilir
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

export default UrunCikar;
