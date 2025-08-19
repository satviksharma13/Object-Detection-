import { useState, useRef, useEffect } from 'react'
import { FaCopy } from 'react-icons/fa';
import axios from "axios";

function App() {

  const [Uploadtype, setUploadtype] = useState(0);
  const [outputType, setoutputType] = useState(0);
  const [label, setlabel] = useState(true);
  const [stroke, setstroke] = useState(2);
  const [showResult, setshowResult] = useState(false);
  const [isloading, setisloading] = useState(false);
  const [result, setresult] = useState(null);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const generateRef = useRef(null);
  const resultRef = useRef(null);

  var imgUrl = useRef('');
  var imgFile = useRef(null);
  var classes = useRef('');
  var minConfidence = useRef(40);
  var maxOverlap = useRef(30);

  useEffect(() => {
    if (inputRef.current) {
      if (!Uploadtype) {
        inputRef.current.disabled = true;
        inputRef.current.placeholder = '';
      }
      else {
        inputRef.current.disabled = false;
        inputRef.current.placeholder = 'https://path.to/your.jpg';
      }
      inputRef.current.value = '';
    }
    imgFile.current = null;
    imgUrl.current = '';
  }, [Uploadtype]);

  useEffect(() => {
    if(resultRef.current)
      resultRef.current.scrollIntoView({behavior: 'smooth'});
  }, [showResult])

  const handleBrowseButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    imgFile.current = event.target.files[0];
    inputRef.current.value = imgFile.current.name;
  }

  const generate = async () => {
    var iserror = false;
    setisloading(true);
    setshowResult(true);
    if (generateRef.current)
      generateRef.current.disabled = true;

    if (Uploadtype) {
      try {
        const response = await fetch(imgUrl.current);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const blob = await response.blob();
        if (blob.type.startsWith('image/')) {
          imgFile.current = blob;
        } else {
          throw new Error('The URL does not point to a valid image.');
        }
      } catch (error) {
        alert('Failed to fetch the image. Please check the URL.');
        console.log(error);
        iserror = true;
      }
    }
    else {
      if (!(imgFile.current && imgFile.current.type.startsWith('image/'))) {
        alert('Please upload an image file.');
        iserror = true;
      }
    }
    
    if (!iserror) {
      const formData = new FormData();
      formData.append('file', imgFile.current);
      formData.append('classes', classes.current.toLowerCase());
      formData.append('confidence', minConfidence.current);
      formData.append('overlap', maxOverlap.current);
      formData.append('type', outputType);
      if (!outputType) {
        formData.append('label', label);
        formData.append('stroke', stroke);
      }

      try {
        const response = await axios.post('http://127.0.0.1:5000/detect', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        if (!response.data.OK)
          throw new Error(response.data.error);
        else {
          setisloading(false);
          if (outputType)
            setresult(response.data.json);
          else
            setresult(`data:image/png;base64,${response.data.file}`);
        }
      } catch (error) {
        alert(error);
        setisloading(false);
        setshowResult(false);
      }
    }
    else {
      setisloading(false);
      setshowResult(false);
    }
    if (generateRef.current)
      generateRef.current.disabled = false;
  }

  const handleCopy = () => {
    if (imgFile.current != null) {
      if (outputType) {
        navigator.clipboard.writeText(JSON.stringify(result, null, 2))
          .then(() => {
            alert('Code copied to clipboard!');
          })
          .catch((err) => {
            console.error('Failed to copy code: ', err);
          });
      }
      else {
        fetch(result)
          .then(response => response.blob())
          .then(blob => {
            const item = new ClipboardItem({ [blob.type]: blob });
            navigator.clipboard.write([item])
              .then(() => {
                alert('Image copied to clipboard!');
              })
              .catch(err => {
                console.error('Failed to copy image: ', err);
              });
          });
      }
    }
  }

  return (
    <>
      <link rel="stylesheet" href="https://pro.fontawesome.com/releases/v5.10.0/css/all.css" integrity="sha384-AYmEC3Yw5cVb3ZcuHtOA93w35dYTsvhLPVnYs9eStHfGJvOvKxVfELGroGkvsg+p" crossOrigin="anonymous"></link>

      {/* navbar */}
      <nav className="bg-violet-600 text-white py-4 w-full">
        <span className="font-bold text-3xl mx-9">Object Detection</span>
      </nav>

      <div className='p-20 text-gray-500 text-xl'>

        {/* image input */}
        <div className='flex gap-8'>

          <div>
            <p className='mb-5'>Upload Method</p>
            <div className='flex'>
              <button onClick={() => { setUploadtype(0) }} className={'w-40 py-2 border-[1px] border-purple-400 rounded-s-md ' + (Uploadtype ? 'hover:bg-violet-100' : 'bg-violet-600 text-white hover:bg-violet-700')} >Upload</button>
              <button onClick={() => { setUploadtype(1) }} className={'w-40 py-2 border-[1px] border-purple-400 rounded-e-md ' + (!Uploadtype ? 'hover:bg-violet-100' : 'bg-violet-600 text-white hover:bg-violet-700')} >URL</button>
            </div>
          </div>

          <div>
            <p className='mb-5'>{Uploadtype ? <span>Enter Image URL</span> : <span>Select File</span>}</p>
            <div className='flex'>
              <input ref={inputRef} type='text' onChange={(event) => { imgUrl.current = event.target.value; }} className={'py-2 px-3 border-[1px] border-purple-400' + (Uploadtype ? ' rounded-md w-[50rem]' : ' rounded-s-md w-[40rem]')}></input>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className='hidden' />
              {!Uploadtype && <button onClick={handleBrowseButtonClick} className='w-40 py-2 rounded-e-md bg-violet-600 text-white hover:bg-violet-700'>Browse</button>}
            </div>
          </div>

        </div>

        {/* input parameters */}
        <div className='flex gap-8 mt-20'>

          <div>
            <p className='mb-5'>Filter Classes</p>
            <input type="text" placeholder='Enter class names' className='w-[35rem] py-2 px-3 border-[1px] border-purple-400 rounded-md' onChange={(event) => { classes.current = event.target.value; }} />
            <p className='text-lg'>Separate names with commas</p>
          </div>

          <div>
            <p className='mb-5'>Min Confidence</p>
            <div>
              <i className="fas fa-crown text-purple-600 absolute z-10 mt-[0.9rem] mx-3 text-lg"></i>
              <span className='absolute z-10 mt-[0.6rem] ml-[14.5rem]'>%</span>
              <input type="number" min={0} max={100} defaultValue={40} className='w-[16.5rem] py-2 px-11 border-[1px] border-purple-400 rounded-md z-0 text-lg' onChange={(event) => { minConfidence.current = event.target.valueAsNumber; }} />
            </div>
          </div>

          <div>
            <p className='mb-5'>Max Overlap</p>
            <div>
              <i className="fas fa-object-ungroup text-purple-600 absolute z-10 mt-[0.9rem] mx-3 text-lg"></i>
              <span className='absolute z-10 mt-[0.6rem] ml-[14.5rem]'>%</span>
              <input type="number" min={0} max={100} defaultValue={30} className='w-[16.5rem] py-2 px-11 border-[1px] border-purple-400 rounded-md z-0 text-lg' onChange={(event) => { maxOverlap.current = event.target.valueAsNumber; }} />
            </div>

          </div>
        </div>

        {/* output parameters */}
        <div>
          <div>
            <p className='mb-5 mt-20'>Inference Result</p>
            <div className='flex'>
              <button onClick={() => { setoutputType(0); setshowResult(false); }} className={'w-32 py-2 border-[1px] border-purple-400 rounded-s-md ' + (outputType ? 'hover:bg-violet-100' : 'bg-violet-600 text-white hover:bg-violet-700')} >Image</button>
              <button onClick={() => { setoutputType(1); setshowResult(false); }} className={'w-32 py-2 border-[1px] border-purple-400 rounded-e-md ' + (!outputType ? 'hover:bg-violet-100' : 'bg-violet-600 text-white hover:bg-violet-700')} >JSON</button>
            </div>
          </div>

          {!outputType && <div className='flex gap-80 mt-20'>
            <div>
              <p className='mb-5'>Labels</p>
              <div className='flex'>
                <button onClick={() => { setlabel(false) }} className={'w-20 py-2 border-[1px] border-purple-400 rounded-s-md ' + (label ? 'hover:bg-violet-100' : 'bg-violet-600 text-white hover:bg-violet-700')} >Off</button>
                <button onClick={() => { setlabel(true) }} className={'w-20 py-2 border-[1px] border-purple-400 rounded-e-md ' + (!label ? 'hover:bg-violet-100' : 'bg-violet-600 text-white hover:bg-violet-700')} >On</button>
              </div>
            </div>

            <div>
              <p className='mb-5'>Stroke Width</p>
              <div className='flex'>
                <button onClick={() => { setstroke(1) }} className={'w-20 py-2 border-[1px] border-purple-400 rounded-s-md ' + (stroke == 1 ? 'bg-violet-600 text-white hover:bg-violet-700' : 'hover:bg-violet-100')} >1px</button>
                <button onClick={() => { setstroke(2) }} className={'w-20 py-2 border-[1px] border-purple-400 border-l-0 ' + (stroke == 2 ? 'bg-violet-600 text-white hover:bg-violet-700' : 'hover:bg-violet-100')} >2px</button>
                <button onClick={() => { setstroke(5) }} className={'w-20 py-2 border-[1px] border-purple-400 border-l-0 ' + (stroke == 5 ? 'bg-violet-600 text-white hover:bg-violet-700' : 'hover:bg-violet-100')} >5px</button>
                <button onClick={() => { setstroke(10) }} className={'w-20 py-2 border-[1px] border-purple-400 rounded-e-md border-l-0 ' + (stroke == 10 ? 'bg-violet-600 text-white hover:bg-violet-700' : 'hover:bg-violet-100')} >10px</button>
              </div>
            </div>
          </div>}
        </div>

        {/* generate button */}
        <button ref={generateRef} onClick={generate} className='w-44 py-4 border-[1px] border-purple-400 rounded-md bg-violet-600 text-white hover:bg-violet-700 mt-20' >generate</button>

        {/* result */}
        {showResult &&
          <div ref={resultRef} className='mt-20'>
            <div className='h-[1px] bg-purple-600'></div>
            <div className='mt-10'>
              <div className='flex justify-between text-2xl'>
                <div>Result</div>
                <button className='text-purple-600 hover:text-gray-500 flex justify-between active:text-gray-500' onClick={handleCopy}><FaCopy />copy {outputType ? <span>code</span> : <span>image</span>}</button>
              </div>
              <div className='mt-10 flex justify-center'>
                <div className='bg-white border-[1px] p-5'>
                  {isloading ? <span>generating...</span> :
                    outputType ?
                      typeof result === 'object' && (
                        <div>
                          <pre>{JSON.stringify(result, null, 2)}</pre>
                        </div>
                      )
                      :
                      typeof result === 'string' && (
                        <div>
                          <img src={result} alt="image" />
                        </div>
                      )
                  }
                </div>
              </div>
            </div>
          </div>}
      </div>
    </>
  )
}

export default App
