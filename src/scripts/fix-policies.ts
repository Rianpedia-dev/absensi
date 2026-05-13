import postgres from 'postgres';
import 'dotenv/config';

async function fixPolicies() {
    const sql = postgres(process.env.DATABASE_URL!);
    
    try {
        console.log("Updating storage policies to allow public (anon) uploads for testing...");
        
        await sql`
            DO $$
            BEGIN
                -- Drop existing restrictive policies if any
                DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
                DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;

                -- Allow anyone to upload (for simple setup)
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies WHERE policyname = 'Public Upload' AND tablename = 'objects' AND schemaname = 'storage'
                ) THEN
                    CREATE POLICY "Public Upload" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'photos');
                END IF;

                -- Allow anyone to update
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies WHERE policyname = 'Public Update' AND tablename = 'objects' AND schemaname = 'storage'
                ) THEN
                    CREATE POLICY "Public Update" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'photos');
                END IF;

                -- Allow anyone to delete (optional, but good for testing)
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies WHERE policyname = 'Public Delete' AND tablename = 'objects' AND schemaname = 'storage'
                ) THEN
                    CREATE POLICY "Public Delete" ON storage.objects FOR DELETE TO public USING (bucket_id = 'photos');
                END IF;
            END
            $$;
        `;
        
        console.log("Public storage policies ensured.");

    } catch (error) {
        console.error("Error updating policies:", error);
    } finally {
        await sql.end();
    }
}

fixPolicies();
