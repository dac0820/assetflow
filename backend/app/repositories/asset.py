from typing import Optional, List, Any, Dict
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from sqlalchemy.dialects.postgresql import JSONB
from app.repositories.base import BaseRepository
from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate

class AssetRepository(BaseRepository[Asset]):
    """
    Data Access Layer operations for physical assets directory
    """
    def __init__(self):
        super().__init__(Asset)

    def get_by_serial(self, db: Session, serial: str) -> Optional[Asset]:
        """
        Retrieves active asset by unique serial number
        """
        return db.query(self.model).filter(
            self.model.serial_number == serial,
            self.model.is_deleted == False
        ).first()

    def search_assets(
        self,
        db: Session,
        *,
        search_term: Optional[str] = None,
        category_id: Optional[Any] = None,
        location_id: Optional[Any] = None,
        status: Optional[str] = None,
        min_cost: Optional[float] = None,
        max_cost: Optional[float] = None,
        metadata_filters: Optional[Dict[str, Any]] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Asset]:
        """
        Queries the assets catalog applying filter parameters and full-text searches
        """
        query = db.query(self.model).filter(self.model.is_deleted == False)
        
        # Apply standard filters
        if category_id:
            query = query.filter(self.model.category_id == category_id)
        if location_id:
            query = query.filter(self.model.location_id == location_id)
        if status:
            query = query.filter(self.model.status == status)
            
        # Apply cost range filters
        if min_cost is not None:
            query = query.filter(self.model.purchase_cost >= min_cost)
        if max_cost is not None:
            query = query.filter(self.model.purchase_cost <= max_cost)
            
        # Full-text / wildcard text search on name or serial number
        if search_term:
            search_pattern = f"%{search_term}%"
            query = query.filter(
                or_(
                    self.model.name.ilike(search_pattern),
                    self.model.serial_number.ilike(search_pattern)
                )
            )
            
        # JSONB Metadata matching using the postgresql containment operator (@>)
        if metadata_filters:
            query = query.filter(self.model.custom_metadata.contains(metadata_filters))
            
        return query.order_by(self.model.created_at.desc()).offset(skip).limit(limit).all()

    def get_allocation_history(self, db: Session, asset_id: Any) -> List[Any]:
        """
        Retrieves active allocation logs associated with the asset UUID
        """
        # Delay import to avoid circular dependency
        from app.models.operations import AssetAllocation
        return db.query(AssetAllocation).filter(
            AssetAllocation.asset_id == asset_id
        ).order_by(AssetAllocation.allocated_at.desc()).all()

# Instantiate global asset repository wrapper
asset_repository = AssetRepository()
