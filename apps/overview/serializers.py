# cầu nối giữa model và view

from rest_framework import serializers

from .models import JobDescription, Resume
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = [
            "id",
            "filename",
            "mime_type",
            "upload_time",
        ]
        read_only_fields = ("upload_time",)


class JobDescriptionSerializer(serializers.ModelSerializer):
    file_content = serializers.CharField(write_only=True, required=False, allow_null=True)
    class Meta:
        model = JobDescription
        fields = ['id', 'filename', 'mime_type', 'file_content', 'upload_time']
        extra_kwargs = {
            'file_content': {'write_only': True, 'required': False, 'allow_null': True},
        }


    def to_internal_value(self, data):
        logger.debug(f"[Serializer-to_internal_value] Initial data: {data}")
        mutable_data = data.copy()
        
        temp_file_content_bytes = None

        if 'content' in mutable_data and mutable_data['content'] is not None:
            text_content = mutable_data['content']
            temp_file_content_bytes = text_content.encode('utf-8')
            mutable_data['mime_type'] = 'text/plain'

            if not mutable_data.get('filename'):
                timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
                mutable_data['filename'] = f"New_JD_{timestamp}.txt"
                logger.debug(f"[Serializer-to_internal_value] Assigned new filename: {mutable_data['filename']}")
            elif not mutable_data['filename'].endswith('.txt'):
                current_filename = mutable_data['filename']
                mutable_data['filename'] = f"{current_filename.rsplit('.', 1)[0] if '.' in current_filename else current_filename}.txt"
                logger.debug(f"[Serializer-to_internal_value] Updated filename to .txt: {mutable_data['filename']}")
            
            del mutable_data['content']
            logger.debug(f"[Serializer-to_internal_value] After processing 'content', temp_file_content_bytes (first 50 bytes): {temp_file_content_bytes[:50]}...")
            logger.debug(f"[Serializer-to_internal_value] Mime_type set: {mutable_data.get('mime_type')}")
        else:
            logger.debug(f"[Serializer-to_internal_value] 'content' not found or is None. Data unchanged for content processing.")
        
        result = super().to_internal_value(mutable_data)
        logger.debug(f"[Serializer-to_internal_value] Super call result: {result}")
        if temp_file_content_bytes is not None:
            result['file_content'] = temp_file_content_bytes
            logger.debug(f"[Serializer-to_internal_value] Re-assigned file_content to result: {result.get('file_content')[:50]}...")

        return result
    
    def create(self, validated_data):
        logger.debug(f"[JobDescriptionSerializer-create] validated_data before model create: {validated_data}")
        if 'file_content' in validated_data and validated_data['file_content'] is not None:
             logger.debug(f"[JobDescriptionSerializer-create] validated_data['file_content'] type: {type(validated_data['file_content'])}, value (first 100 bytes): {validated_data['file_content'][:100]}")
        else:
             logger.debug(f"[JobDescriptionSerializer-create] validated_data['file_content'] is empty or None.")
        
        return super().create(validated_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        if instance.file_content:
            try:
                file_content_as_bytes = bytes(instance.file_content)
                representation['content'] = file_content_as_bytes.decode('utf-8', errors='ignore')
            except UnicodeDecodeError:
                representation['content'] = "[Unable to decode text content]"
        else:
            representation['content'] = "" 

        return representation   