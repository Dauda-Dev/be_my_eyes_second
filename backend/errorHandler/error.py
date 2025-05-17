
def volume_error (timestamp):
      return{
                    
                        "transcription": {
                            "speaker_id": "None",
                            "text": "[Too quiet to transcribe]",
                            "translation": "[Too quiet to translate]"
                        },
                        "timestamp": timestamp,
                        "type": "response"
                        # "bboxes": [{
                        #     "bbox": None,
                        #     "speaker_id": "None",
                        # }]
                    }
