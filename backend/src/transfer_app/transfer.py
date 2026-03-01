import socket
import os
import threading
import logging

logger = logging.getLogger("TransferLib")

PORT = 9999
BUFFER_SIZE = 4096

def start_receiver(save_dir="received_files"):
    """
    Starts a background thread to listen for incoming files.
    """
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    def listen():
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        # Allow reuse address to avoid "Address already in use" errors during dev
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            server_socket.bind(("0.0.0.0", PORT))
            server_socket.listen(5)
            logger.info(f"Receiver listening on port {PORT}")
            
            while True:
                client_socket, addr = server_socket.accept()
                logger.info(f"Connection from {addr}")
                
                # Simple protocol: First 1024 bytes = filename padded
                # Then file content
                try:
                    filename_bytes = client_socket.recv(1024)
                    filename = filename_bytes.decode('utf-8').strip()
                    # Sanitize filename
                    filename = os.path.basename(filename)
                    
                    save_path = os.path.join(save_dir, filename)
                    with open(save_path, "wb") as f:
                        while True:
                            bytes_read = client_socket.recv(BUFFER_SIZE)
                            if not bytes_read:
                                break
                            f.write(bytes_read)
                    logger.info(f"Received file: {save_path}")
                except Exception as e:
                    logger.error(f"Error receiving file: {e}")
                finally:
                    client_socket.close()
        except OSError as e:
            logger.error(f"Socket error: {e}")

    t = threading.Thread(target=listen, daemon=True)
    t.start()
    return t

def send_file(filepath, target_ip):
    """
    Sends a file to the target IP via socket.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File {filepath} not found")

    filename = os.path.basename(filepath)
    filesize = os.path.getsize(filepath)

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.connect((target_ip, PORT))
        
        # Protocol: Send filename padded to 1024 bytes
        filename_header = f"{filename:<1024}"
        s.send(filename_header.encode('utf-8'))
        
        with open(filepath, "rb") as f:
            while True:
                bytes_read = f.read(BUFFER_SIZE)
                if not bytes_read:
                    break
                s.send(bytes_read)
        
        logger.info(f"File {filename} sent to {target_ip}")
        return True
    except Exception as e:
        logger.error(f"Send failed: {e}")
        raise e
    finally:
        s.close()
