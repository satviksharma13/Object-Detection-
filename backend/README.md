# Ultralytics Installation and Setup

This guide provides the steps to install and set up Ultralytics in your backend directory.

## Prerequisites

- Python 3.7+
- Git
- pip

## Installation Steps

Follow these steps to install and configure Ultralytics.

1. Navigate to your backend directory:
    ```bash
    cd {PATH_TO_BACKEND_DIRECTORY}
    ```

2. Clone the Ultralytics repository:
    ```bash
    git clone https://github.com/ultralytics/ultralytics
    ```

3. Change to the Ultralytics directory:
    ```bash
    cd ultralytics
    ```

4. Reset the repository to a specific commit:
    ```bash
    git reset --hard 2071776a3672eb835d7c56cfff22114707765ac
    ```

5. Install the specific version of Ultralytics:
    ```bash
    pip install ultralytics==8.0.196
    ```

6. Install the package in editable mode:
    ```bash
    pip install -e .
    ```

7. Download and apply the patch:
    ```bash
    wget https://gist.githubusercontent.com/Y-T-G/8f4fc0b78a0a559a06fe84ae4f359e6e/raw/17b1407fefeac86d089c4cf14f174c8bb44948af/add_head.patch
    git apply add_head.patch
    ```

## Directory Structure

After following the above steps, your directory structure should look like this:


## Files Description

- `ultralytics/`: The main directory containing the cloned Ultralytics repository and additional files.
- `ultralytics/server.py`: Custom server script for running the application.
- `ultralytics/yolov8x-2xhead.yaml`: Configuration file for the YOLOv8 model.
- `ultralytics/yolov8x_lp.pth`: Pretrained weights for the YOLOv8 model.

## Usage

To run your application, navigate to the `ultralytics` directory and execute the server script:

```bash
cd {PATH_TO_BACKEND_DIRECTORY}/ultralytics
python server.py

Replace `{PATH_TO_BACKEND_DIRECTORY}` with the actual path to your backend directory. This `README.md` provides a clear and structured guide for installing and setting up Ultralytics.
