import { createClient } from '@/utils/supabase/server'
import { Plus, Mail, Phone } from 'lucide-react'

export default async function ContactsPage() {
  const supabase = createClient()
  
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700">
          <Plus className="w-5 h-5 mr-2" />
          Add Contact
        </button>
      </div>

      {error && <div className="text-red-500">Error loading contacts: {error.message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contacts?.map((contact) => (
          <div key={contact.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{contact.name}</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {contact.email || 'No email'}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                {contact.phone_e164 || 'No phone'}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">Edit</button>
            </div>
          </div>
        ))}
        {(!contacts || contacts.length === 0) && (
          <div className="col-span-full py-20 text-center bg-white rounded-lg border-2 border-dashed border-gray-200 text-gray-500">
            No contacts found. Add contacts to subscribe them to flight updates.
          </div>
        )}
      </div>
    </div>
  )
}
