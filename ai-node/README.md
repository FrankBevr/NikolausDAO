# NikolausDAO - AI Node

The _NikolausDAO AI Node_ is a command line application, that can be used to join the NikolausDAO as an _AI inference node_. The system uses _Proof-of-Authority_ to verify the inference nodes. AI inference nodes _generate 3D models_ from the _member prompts_. Node owners are _rewarded_ for the work they perform, if _at least 3 users_ approve their work.

# Dependencies

The AI inference node uses _Node.JS_, and _Python_. We use _OpenAI Shap-E_ to generate the 3D models.

# Setting up

_Setup is currently only supported on Linux! Application has only been tested on Ubuntu 23.04, in Google Cloud, using an NVidia L4 GPU._

* Get an _NVidia GPU_, that supports CUDA 11.8+
* Install _Node.JS_, _Python_, _NVidia drivers_, and _CUDA_
* Go into the `py` directory ...
    * Run `bash setup.sh`
* Go into the `node` directory ...
    * Run `npm install`

# Running

* In a new terminal, navigate into the `node` directory
    * Run `npm start`
* In another new terminal, navigate into the `py` directory
    * Run `bash run.sh`

# Registering as a node

!!!TODO!!!
