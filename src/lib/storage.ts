import { supabase } from "./supabase"

export async function uploadPhoto(file: File, userId: string) {
  if (!supabase) {
    console.error("Supabase client is not initialized. NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY might be missing.")
    throw new Error("Supabase client is not initialized. Periksa Environment Variables di Vercel.")
  }
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `employees/${fileName}`

  console.log(`Attempting to upload file to bucket 'photos' at path: ${filePath}`)

  const { data, error } = await supabase.storage
    .from('photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Supabase storage upload error detail:', {
        message: error.message,
        name: error.name,
        // @ts-ignore
        status: error.status,
        // @ts-ignore
        statusCode: error.statusCode
    })
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
