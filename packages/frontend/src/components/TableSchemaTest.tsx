import { useState } from 'react'
import { supabase } from '../supabaseClient'

export function TableSchemaTest() {
  const [schemaInfo, setSchemaInfo] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testTableSchema = async () => {
    setLoading(true)
    setSchemaInfo('Testing table schema...')
    
    try {
      // Try to get table information
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(1)
      
      if (error) {
        setSchemaInfo(`Error: ${error.message}`)
        return
      }
      
      if (data && data.length > 0) {
        const sampleRecord = data[0]
        const columns = Object.keys(sampleRecord)
        setSchemaInfo(`Table columns: ${columns.join(', ')}\nSample data: ${JSON.stringify(sampleRecord, null, 2)}`)
      } else {
        // Try to insert a test record with string values
        const testData = {
          name: 'Test Project',
          language: 'JavaScript',
          device: 'Web'
        }
        
        setSchemaInfo(prev => prev + `\nTrying: ${JSON.stringify(testData)}`)
        
        const { data: insertData, error: insertError } = await supabase
          .from('projects')
          .insert([testData])
          .select()
        
        if (insertError) {
          setSchemaInfo(prev => prev + `\n❌ Error: ${insertError.message}`)
        } else {
          setSchemaInfo(prev => prev + `\n✅ Success! Created test project with ID: ${insertData?.[0]?.id}`)
          // Clean up the test record
          if (insertData && insertData[0]) {
            await supabase.from('projects').delete().eq('id', insertData[0].id)
          }
        }
      }
    } catch (err) {
      setSchemaInfo(`Exception: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border text-xs max-w-sm z-50 max-h-96 overflow-y-auto">
      <h3 className="font-semibold mb-2">Table Schema Test</h3>
      <button
        onClick={testTableSchema}
        disabled={loading}
        className="bg-blue-500 text-white px-2 py-1 rounded text-xs mb-2 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Schema'}
      </button>
      <div className="text-xs text-gray-600 whitespace-pre-wrap">
        {schemaInfo}
      </div>
    </div>
  )
} 