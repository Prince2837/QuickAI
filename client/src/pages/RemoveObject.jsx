import React, { useState } from "react";
import { Edit, Eraser, Hash, Scissors, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import Markdown from "react-markdown";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const RemoveObject = () => {
  const [input, setInput] = useState('')
  const [object, setObject] = useState('')
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  const { getToken } = useAuth();
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      setLoading(true)

      //object pass ex.car => so remove car  but only one object not more than one

      if (object.split(' ').length > 1) {
        return toast('Please enter only one object name')
      }

      const formData = new FormData()
      formData.append('image', input)
      formData.append('object', object)

      const { data } = await axios.post(
        "/api/ai/remove-image-object", formData,
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );
      if (data.success) {
        setContent(data.content);
      } else {
        toast.error(data.message);
      }
    }
    catch (error) {
      toast.error(error.message);
    }
    setLoading(false)
  }
  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

      {/* Left Column */}
      <form onSubmit={onSubmitHandler} className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200">

        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">
            Object Removal
          </h1>
        </div>
        <p className='mt-6 text-sm font-medium'>Upload Image</p>

        <input onChange={(e) => setInput(e.target.files[0])} type="file" accept="image/*" className='w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 text-gray-600' required />

        <p className="mt-6 text-sm font-medium"> Describe Object name to remove </p>

        <textarea rows={4} value={object} onChange={(e) => setObject(e.target.value)} placeholder="e.g., watch or spoon, Only single object name" required className="w-full mt-2 p-3 text-sm rounded-md border border-gray-300 outline-none focus:ring-2 focus:ring-green-400" />

        <button disabled={loading} className='w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#417DF6] to-[#8E37EB]        text-white px-4 py-2 mt-6 text-sm rounded-lg cursor-pointer'>
          {
            loading ? <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"></span>
              : <Scissors className='w-5' />
          }
          Remove Object
        </button>
      </form>

      {/* Right Column */}

      <div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 ">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Scissors className="w-5 h-5 text-[#4A7AFF]" />
          <h1 className="text-xl font-semibold">
            Processed Image
          </h1>
        </div>
        {

        }

        {/* Empty State */}
        {!content ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400">
              <Eraser className="w-9 h-9" />
              <p> Upload an image and click "Remove Object" to get started</p>
            </div>
          </div>
        ) :
           (
            <img src={content} alt="image" className="mt-3 w-full h-full " />
          )}
      </div>
    </div>
  )
}

export default RemoveObject
