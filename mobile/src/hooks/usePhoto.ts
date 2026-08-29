import { useCallback, useState } from "react";
import * as ImagePicker from "expo-image-picker";

export interface AttachedPhoto {
  uri: string;
  base64: string;
  contentType: "image/jpeg";
}

export interface PhotoState {
  photo: AttachedPhoto | null;
  pickFromLibrary: () => Promise<void>;
  takePhoto: () => Promise<void>;
  clear: () => void;
}

function toAttached(asset: ImagePicker.ImagePickerAsset | undefined): AttachedPhoto | null {
  if (!asset?.base64) return null;
  return { uri: asset.uri, base64: asset.base64, contentType: "image/jpeg" };
}

/** Optional photo attachment via camera or library. */
export function usePhoto(): PhotoState {
  const [photo, setPhoto] = useState<AttachedPhoto | null>(null);

  const pickFromLibrary = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.6,
    });
    if (!result.canceled) setPhoto(toAttached(result.assets[0]));
  }, []);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.6,
    });
    if (!result.canceled) setPhoto(toAttached(result.assets[0]));
  }, []);

  const clear = useCallback(() => setPhoto(null), []);

  return { photo, pickFromLibrary, takePhoto, clear };
}
