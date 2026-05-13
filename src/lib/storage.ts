import { supabase } from "./supabase"

export async function uploadPhoto(file: File, userId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Math.random()}.${fileExt}`
  const filePath = `employees/${fileName}`

  const { data, error } = await supabase.storage
    .from('photos')
    .upload(filePath, file)

  if (error) {
    console.error('Supabase storage upload error:', error)
    throw error
  }

  const { data: { publicUrl } } = supabase.storage
    .from('photos')
    .getPublicUrl(filePath)

  return publicUrl
}

export async function deletePhoto(url: string) {
    try {
        const path = url.split('/photos/')[1];
        if (path) {
            await supabase.storage.from('photos').remove([path]);
        }
    } catch (error) {
        console.error("Error deleting photo:", error);
    }
}
